// Core TypeScript types for the bottle ledger app

export type Language = "en" | "am"
export type TrustStatus = "approved" | "pending" | "blocked"
export type TransactionType = "issue" | "return" | "settle"
export type BottleCategory = "Soft Drink" | "Beer" | "Wine" | "Sofi" | "Other"
export type BottleType = "Soft Drink (300ML)" | "Beer" | "Wine" | "Sofi Malt" | "500ML" | "300ML" | "Other"

export interface User {
  id: string
  username: string
  passwordHash: string // Renamed from pinHash
  name: string
  createdAt: Date | string
}

// For storing in localStorage users list
export interface UserAccount extends User { }

// Safe user object without sensitive data (for session storage)
export interface SafeUser {
  id: string
  username: string
  name: string
  createdAt: Date | string
}

export interface Customer {
  id: string
  userId: string
  name: string
  phone: string
  address?: string
  trustStatus: TrustStatus
  bottlesOutstanding: number
  depositsHeld: number
  lastTransaction?: Date | string
  lastSyncedAt?: string
}

export interface TransactionItem {
  category: BottleCategory
  brand: string
  bottleType: BottleType
  bottleCount: number
  depositAmount: number
}

export interface InventoryItem {
  category: BottleCategory
  brand: string
  bottleType: BottleType
  count: number
}

export interface Transaction {
  id: string
  userId: string
  customerId: string
  customerName?: string
  type: TransactionType
  // Summary fields (kept for backward compatibility and list view)
  category: BottleCategory
  brand: string
  bottleType: BottleType
  bottleCount: number
  depositAmount: number
  // New: List of items
  items?: TransactionItem[]
  notes?: string
  timestamp: Date | string
  lastSyncedAt?: string
}

export interface AuthState {
  isLoggedIn: boolean
  user: SafeUser | null
  loading: boolean
  error?: string
}

export interface AppState {
  auth: AuthState
  customers: Customer[]
  transactions: Transaction[]
}
