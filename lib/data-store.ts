// Client-side data store for customers and transactions
// Offline-first with Supabase sync

import type { Customer, Transaction, InventoryItem, SafeUser } from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"
import {
  syncCustomerToCloud,
  syncCustomerUpdateToCloud,
  syncCustomerDeleteToCloud,
  syncTransactionToCloud,
  syncTransactionDeleteToCloud,
} from "./sync-service"

// Simulate data persistence with localStorage
const CUSTOMERS_KEY = "bottletrack_customers"
const TRANSACTIONS_KEY = "bottletrack_transactions"
const SESSION_KEY = "bottletrack_session"

const STORAGE_VERSION = "v1.3" // Version bump for multi-user support
const VERSION_KEY = "bottletrack_version"

const initializeStoredData = () => {
  if (typeof window === "undefined") return

  try {
    const currentVersion = localStorage.getItem(VERSION_KEY)

    // If version mismatch or missing, we might need to migrate or clear
    // For this transition, we'll keep existing data but it might lack userId
    if (currentVersion !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION)
      console.log("Data store updated to version:", STORAGE_VERSION)
    }
  } catch (e) {
    console.error("Failed to initialize data:", e)
  }
}

// Initialize on first load
if (typeof window !== "undefined") {
  initializeStoredData()
}

// Helper to get current user ID from Supabase session
const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    // Supabase stores the session in localStorage with a specific key format
    // We can try to find it or use the supabase client if it has it cached
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1].split(".")[0]
    const sessionStr = localStorage.getItem(`sb-${projectRef}-auth-token`)
    if (sessionStr) {
      const session = JSON.parse(sessionStr)
      return session.user?.id || null
    }
  } catch {
    return null
  }
  return null
}

// Artificial delay helper
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export const getCustomers = (): Customer[] => {
  if (typeof window === "undefined") return []

  const userId = getCurrentUserId()
  if (!userId) return []

  try {
    const stored = localStorage.getItem(CUSTOMERS_KEY)
    const allCustomers: Customer[] = stored ? JSON.parse(stored) : []
    // Filter by userId
    return allCustomers.filter(c => c.userId === userId)
  } catch {
    return []
  }
}

export const getTransactions = (): (Transaction & { customerName: string })[] => {
  const userId = getCurrentUserId()
  if (!userId) return []

  const customers = getCustomers()
  const rawTransactions: Transaction[] = (() => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(TRANSACTIONS_KEY)
      const allTransactions: Transaction[] = stored ? JSON.parse(stored) : []
      // Filter by userId
      return allTransactions.filter(t => t.userId === userId)
    } catch {
      return []
    }
  })()

  return rawTransactions.map((t) => ({
    ...t,
    customerName: customers.find((c) => c.id === t.customerId)?.name || "Unknown",
  }))
}

export const getCustomerById = (id: string): Customer | undefined => {
  return getCustomers().find((c) => c.id === id)
}

export const getCustomerTransactions = (customerId: string): (Transaction & { customerName: string })[] => {
  return getTransactions()
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const getCustomerInventory = (customerId: string): InventoryItem[] => {
  const transactions = getCustomerTransactions(customerId)
  const inventory: Record<string, InventoryItem> = {}

  const sortedTxns = [...transactions].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  for (const txn of sortedTxns) {
    const items = txn.items || [{
      category: txn.category,
      brand: txn.brand,
      bottleType: txn.bottleType,
      bottleCount: txn.bottleCount,
      depositAmount: txn.depositAmount
    }]

    for (const item of items) {
      const key = `${item.category}-${item.brand}-${item.bottleType}`

      if (!inventory[key]) {
        inventory[key] = {
          category: item.category,
          brand: item.brand,
          bottleType: item.bottleType,
          count: 0
        }
      }

      if (txn.type === "issue") {
        inventory[key].count += item.bottleCount
      } else {
        inventory[key].count = Math.max(0, inventory[key].count - item.bottleCount)
      }
    }
  }

  return Object.values(inventory).filter(item => item.count > 0)
}

export const getRecentTransactions = (limit = 5): (Transaction & { customerName: string })[] => {
  return getTransactions()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export const addCustomer = (customer: Customer): { success: boolean; error?: string } => {
  if (typeof window === "undefined") return { success: false }

  const userId = getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  const customers = getCustomers()
  const allStoredStored = localStorage.getItem(CUSTOMERS_KEY)
  const allStored: Customer[] = allStoredStored ? JSON.parse(allStoredStored) : []

  // Check for duplicate phone WITHIN this user's customers
  const phoneExists = customers.some(c => c.phone === customer.phone)
  if (phoneExists) {
    return { success: false, error: "A customer with this phone number already exists." }
  }

  const newCustomer = { ...customer, userId }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([newCustomer, ...allStored]))

  // Sync to cloud
  syncCustomerToCloud(newCustomer)

  return { success: true }
}

export const deleteCustomer = (customerId: string): void => {
  if (typeof window === "undefined") return

  try {
    const userId = getCurrentUserId()
    if (!userId) return

    // 1. Remove customer from all stored
    const allStoredCustomersStored = localStorage.getItem(CUSTOMERS_KEY)
    const allStoredCustomers: Customer[] = allStoredCustomersStored ? JSON.parse(allStoredCustomersStored) : []
    const updatedCustomers = allStoredCustomers.filter(c => c.id !== customerId || c.userId !== userId)
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers))

    // 2. Remove associated transactions from all stored
    const allStoredTransactionsStored = localStorage.getItem(TRANSACTIONS_KEY)
    const allStoredTransactions: Transaction[] = allStoredTransactionsStored ? JSON.parse(allStoredTransactionsStored) : []
    const updatedTransactions = allStoredTransactions.filter(t => t.customerId !== customerId || t.userId !== userId)
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions))

    // Sync to cloud
    syncCustomerDeleteToCloud(customerId)
  } catch (e) {
    console.error("Failed to delete customer:", e)
  }
}

export const updateCustomerTrustStatus = (customerId: string, status: "approved" | "pending" | "blocked"): void => {
  if (typeof window === "undefined") return

  try {
    const userId = getCurrentUserId()
    if (!userId) return

    const allStoredCustomersStored = localStorage.getItem(CUSTOMERS_KEY)
    const allStoredCustomers: Customer[] = allStoredCustomersStored ? JSON.parse(allStoredCustomersStored) : []

    const updatedCustomers = allStoredCustomers.map(c =>
      (c.id === customerId && c.userId === userId) ? { ...c, trustStatus: status } : c
    )
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers))

    // Sync to cloud
    syncCustomerUpdateToCloud(customerId, { trustStatus: status })
  } catch (e) {
    console.error("Failed to update customer trust status:", e)
  }
}

export const addTransaction = (transaction: Transaction): void => {
  if (typeof window === "undefined") return

  try {
    const userId = getCurrentUserId()
    if (!userId) return

    const allStoredTransactionsStored = localStorage.getItem(TRANSACTIONS_KEY)
    const allStoredTransactions: Transaction[] = allStoredTransactionsStored ? JSON.parse(allStoredTransactionsStored) : []

    const newTransaction = { ...transaction, userId }
    const updated = [...allStoredTransactions, newTransaction]
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated))

    // Update customer's outstanding bottles and deposits
    const customer = getCustomerById(transaction.customerId)
    if (customer) {
      const allStoredCustomersStored = localStorage.getItem(CUSTOMERS_KEY)
      const allStoredCustomers: Customer[] = allStoredCustomersStored ? JSON.parse(allStoredCustomersStored) : []

      const updatedCustomers = allStoredCustomers.map((c) => {
        if (c.id === transaction.customerId && c.userId === userId) {
          const totalBottles = transaction.items
            ? transaction.items.reduce((sum, item) => sum + item.bottleCount, 0)
            : transaction.bottleCount

          const totalDeposit = transaction.items
            ? transaction.items.reduce((sum, item) => sum + item.depositAmount, 0)
            : transaction.depositAmount

          const newOutstanding =
            transaction.type === "issue"
              ? c.bottlesOutstanding + totalBottles
              : transaction.type === "return"
                ? Math.max(0, c.bottlesOutstanding - totalBottles)
                : 0
          const newDeposits =
            transaction.type === "issue"
              ? c.depositsHeld + totalDeposit
              : transaction.type === "return"
                ? Math.max(0, c.depositsHeld - totalDeposit)
                : 0

          return {
            ...c,
            bottlesOutstanding: newOutstanding,
            depositsHeld: newDeposits,
            lastTransaction: transaction.timestamp,
          }
        }
        return c
      })
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers))

      // Sync customer update to cloud
      const updatedCustomer = updatedCustomers.find(c => c.id === transaction.customerId && c.userId === userId)
      if (updatedCustomer) {
        syncCustomerUpdateToCloud(transaction.customerId, {
          bottlesOutstanding: updatedCustomer.bottlesOutstanding,
          depositsHeld: updatedCustomer.depositsHeld,
          lastTransaction: updatedCustomer.lastTransaction,
        })
      }
    }

    // Sync transaction to cloud
    syncTransactionToCloud(newTransaction)
  } catch (e) {
    console.error("Failed to add transaction:", e)
  }
}

export const deleteTransaction = (transactionId: string): void => {
  if (typeof window === "undefined") return

  try {
    const userId = getCurrentUserId()
    if (!userId) return

    const allStoredTransactionsStored = localStorage.getItem(TRANSACTIONS_KEY)
    const allStoredTransactions: Transaction[] = allStoredTransactionsStored ? JSON.parse(allStoredTransactionsStored) : []

    const transaction = allStoredTransactions.find(t => t.id === transactionId && t.userId === userId)
    if (!transaction) return

    const updatedTransactions = allStoredTransactions.filter(t => t.id !== transactionId || t.userId !== userId)
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions))

    // Reverse the customer update
    const customer = getCustomerById(transaction.customerId)
    if (customer) {
      const allStoredCustomersStored = localStorage.getItem(CUSTOMERS_KEY)
      const allStoredCustomers: Customer[] = allStoredCustomersStored ? JSON.parse(allStoredCustomersStored) : []

      const updatedCustomers = allStoredCustomers.map((c) => {
        if (c.id === transaction.customerId && c.userId === userId) {
          const totalBottles = transaction.items
            ? transaction.items.reduce((sum, item) => sum + item.bottleCount, 0)
            : transaction.bottleCount

          const totalDeposit = transaction.items
            ? transaction.items.reduce((sum, item) => sum + item.depositAmount, 0)
            : transaction.depositAmount

          const newOutstanding =
            transaction.type === "issue"
              ? Math.max(0, c.bottlesOutstanding - totalBottles)
              : c.bottlesOutstanding + totalBottles
          const newDeposits =
            transaction.type === "issue"
              ? Math.max(0, c.depositsHeld - totalDeposit)
              : c.depositsHeld + totalDeposit

          return {
            ...c,
            bottlesOutstanding: newOutstanding,
            depositsHeld: newDeposits,
          }
        }
        return c
      })
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers))

      // Sync customer update to cloud
      const updatedCustomer = updatedCustomers.find(c => c.id === transaction.customerId && c.userId === userId)
      if (updatedCustomer) {
        syncCustomerUpdateToCloud(transaction.customerId, {
          bottlesOutstanding: updatedCustomer.bottlesOutstanding,
          depositsHeld: updatedCustomer.depositsHeld,
        })
      }
    }

    // Sync transaction delete to cloud
    syncTransactionDeleteToCloud(transactionId)
  } catch (e) {
    console.error("Failed to delete transaction:", e)
  }
}

export const getDashboardStats = () => {
  const customers = getCustomers()
  const transactions = getTransactions()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalBottlesOutstanding = customers.reduce((sum, c) => sum + c.bottlesOutstanding, 0)
  const totalDepositsHeld = customers.reduce((sum, c) => sum + c.depositsHeld, 0)
  const approvedCount = customers.filter((c) => c.trustStatus === "approved").length

  const todayTransactions = transactions.filter((t) => new Date(t.timestamp) >= today)
  const todayIssues = todayTransactions
    .filter((t) => t.type === "issue")
    .reduce((sum, t) => sum + t.bottleCount, 0)
  const todayReturns = todayTransactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + t.bottleCount, 0)

  const totalIssues = transactions
    .filter((t) => t.type === "issue")
    .reduce((sum, t) => sum + t.bottleCount, 0)

  const totalReturns = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + t.bottleCount, 0)

  return {
    totalBottlesOutstanding,
    totalDepositsHeld,
    totalCustomers: customers.length,
    approvedCustomers: approvedCount,
    todayIssues,
    todayReturns,
    totalIssues,
    totalReturns,
  }
}

export const getOverdueCustomers = (days = 14): (Customer & { daysInactive: number })[] => {
  const customers = getCustomers()
  const now = new Date()

  return customers
    .filter((c) => c.bottlesOutstanding > 0)
    .map((c) => {
      const lastTxnDate = c.lastTransaction ? new Date(c.lastTransaction) : new Date(0)
      const daysInactive = Math.floor((now.getTime() - lastTxnDate.getTime()) / (1000 * 60 * 60 * 24))
      return { ...c, daysInactive }
    })
    .filter((c) => c.daysInactive >= days)
    .sort((a, b) => b.daysInactive - a.daysInactive)
}

export const exportData = (): string => {
  if (typeof window === "undefined") return ""

  const data = {
    version: STORAGE_VERSION,
    timestamp: new Date().toISOString(),
    customers: getCustomers(),
    transactions: getTransactions(),
  }

  return JSON.stringify(data, null, 2)
}

export const importData = (jsonString: string): { success: boolean; error?: string } => {
  if (typeof window === "undefined") return { success: false, error: "Window not defined" }

  try {
    const userId = getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    const data = JSON.parse(jsonString)

    if (!Array.isArray(data.customers) || !Array.isArray(data.transactions)) {
      return { success: false, error: "Invalid data format" }
    }

    // Merge with existing data, but only for this user
    const allStoredCustomersStored = localStorage.getItem(CUSTOMERS_KEY)
    const allStoredCustomers: Customer[] = allStoredCustomersStored ? JSON.parse(allStoredCustomersStored) : []
    const otherUsersCustomers = allStoredCustomers.filter(c => c.userId !== userId)

    const newCustomers = data.customers.map((c: any) => ({ ...c, userId }))
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([...otherUsersCustomers, ...newCustomers]))

    const allStoredTransactionsStored = localStorage.getItem(TRANSACTIONS_KEY)
    const allStoredTransactions: Transaction[] = allStoredTransactionsStored ? JSON.parse(allStoredTransactionsStored) : []
    const otherUsersTransactions = allStoredTransactions.filter(t => t.userId !== userId)

    const rawTransactions = data.transactions.map((t: any) => {
      const { customerName, ...rest } = t
      return { ...rest, userId }
    })
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([...otherUsersTransactions, ...rawTransactions]))

    return { success: true }
  } catch (e) {
    console.error("Import failed:", e)
    return { success: false, error: "Failed to parse data" }
  }
}
