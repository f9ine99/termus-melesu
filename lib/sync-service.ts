// Sync service for Supabase integration
// Handles online/offline detection, pending changes queue, and real-time sync

import { supabase, isSupabaseConfigured } from './supabase'
export { isSupabaseConfigured }
import type { Customer, Transaction, TransactionType, BottleCategory, BottleType } from './types'

const PENDING_CHANGES_KEY = 'bottletrack_pending_changes'
const LAST_SYNC_KEY = 'bottletrack_last_sync'

type ChangeType = 'add_customer' | 'update_customer' | 'delete_customer' | 'add_transaction' | 'delete_transaction'

interface PendingChange {
    id: string
    type: ChangeType
    data: any
    timestamp: number
}

// Online/offline state
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
let syncListeners: ((status: SyncStatus) => void)[] = []

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error'
let currentSyncStatus: SyncStatus = isOnline ? 'online' : 'offline'
let lastSyncTimeListeners: ((time: string | null) => void)[] = []

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('Browser online, checking server reachability...')
        await checkServerReachability()
    })

    window.addEventListener('offline', () => {
        isOnline = false
        updateSyncStatus('offline')
    })

    // Periodic heartbeat check
    setInterval(() => {
        if (isOnline) {
            checkServerReachability()
        }
    }, 30000) // Check every 30 seconds
}

/**
 * Robust check to see if Supabase is actually reachable
 */
export async function checkServerReachability(): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    try {
        const { error } = await supabase.from('customers').select('id', { count: 'exact', head: true }).limit(1)

        const reachable = !error || (error.code !== 'PGRST301' && error.message !== 'FetchError' && !error.message.includes('failed to fetch'))

        if (reachable) {
            if (!isOnline) {
                console.log('Server reachable again, switching to online mode')
                isOnline = true
            }

            // Manual sync: Don't automatically process pending changes
            // Just update status to online
            updateSyncStatus('online')
        } else {
            if (isOnline) {
                console.warn('Server unreachable, switching to offline mode')
                isOnline = false
                updateSyncStatus('offline')
            }
        }

        return reachable
    } catch (e) {
        if (isOnline) {
            isOnline = false
            updateSyncStatus('offline')
        }
        return false
    }
}

function updateSyncStatus(status: SyncStatus) {
    currentSyncStatus = status
    syncListeners.forEach(listener => listener(status))
}

export function getSyncStatus(): SyncStatus {
    return currentSyncStatus
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    syncListeners.push(listener)
    return () => {
        syncListeners = syncListeners.filter(l => l !== listener)
    }
}

export function getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(LAST_SYNC_KEY)
}

function setLastSyncTime(time: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LAST_SYNC_KEY, time)
    lastSyncTimeListeners.forEach(listener => listener(time))
}

export function onLastSyncTimeChange(listener: (time: string | null) => void): () => void {
    lastSyncTimeListeners.push(listener)
    return () => {
        lastSyncTimeListeners = lastSyncTimeListeners.filter(l => l !== listener)
    }
}

// Pending changes queue
function getPendingChanges(): PendingChange[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(PENDING_CHANGES_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function savePendingChanges(changes: PendingChange[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes))
}

function addPendingChange(type: ChangeType, data: any): void {
    const changes = getPendingChanges()
    changes.push({
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now()
    })
    savePendingChanges(changes)
}

function removePendingChange(id: string): void {
    const changes = getPendingChanges().filter(c => c.id !== id)
    savePendingChanges(changes)
}

// Mark a local item as synced
function markItemAsSynced(type: 'customer' | 'transaction', id: string): void {
    if (typeof window === 'undefined') return
    const key = type === 'customer' ? 'bottletrack_customers' : 'bottletrack_transactions'
    try {
        const stored = localStorage.getItem(key)
        if (!stored) return
        const items = JSON.parse(stored)
        const updated = items.map((item: any) =>
            item.id === id ? { ...item, lastSyncedAt: new Date().toISOString() } : item
        )
        localStorage.setItem(key, JSON.stringify(updated))
    } catch (e) {
        console.error(`Failed to mark ${type} ${id} as synced:`, e)
    }
}

// Convert localStorage customer to Supabase format
function toSupabaseCustomer(customer: Customer) {
    return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address || null,
        trust_status: customer.trustStatus,
        bottles_outstanding: customer.bottlesOutstanding,
        deposits_held: customer.depositsHeld,
        last_transaction: customer.lastTransaction || null,
        last_synced_at: customer.lastSyncedAt || null,
    }
}

// Convert localStorage transaction to Supabase format
function toSupabaseTransaction(transaction: Transaction) {
    return {
        id: transaction.id,
        customer_id: transaction.customerId,
        type: transaction.type,
        category: transaction.category,
        brand: transaction.brand,
        bottle_type: transaction.bottleType,
        bottle_count: transaction.bottleCount,
        deposit_amount: transaction.depositAmount,
        items: transaction.items || null,
        notes: transaction.notes || null,
        timestamp: transaction.timestamp,
        last_synced_at: transaction.lastSyncedAt || null,
    }
}

// Sync operations
export async function syncCustomerToCloud(customer: Customer): Promise<boolean> {
    // Always add to pending changes for manual sync
    addPendingChange('add_customer', customer)

    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    // Return false to indicate it's not synced yet (it's in the queue)
    return false
}

export async function syncCustomerUpdateToCloud(customerId: string, updates: Partial<Customer>): Promise<boolean> {
    // Always add to pending changes for manual sync
    addPendingChange('update_customer', { id: customerId, ...updates })

    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    return false
}

export async function syncCustomerDeleteToCloud(customerId: string): Promise<boolean> {
    // Always add to pending changes for manual sync
    addPendingChange('delete_customer', { id: customerId })

    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    return false
}

export async function syncTransactionToCloud(transaction: Transaction): Promise<boolean> {
    // Always add to pending changes for manual sync
    addPendingChange('add_transaction', transaction)

    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    return false
}

export async function syncTransactionDeleteToCloud(transactionId: string): Promise<boolean> {
    // Always add to pending changes for manual sync
    addPendingChange('delete_transaction', { id: transactionId })

    if (!isSupabaseConfigured() || !supabase) {
        return false
    }

    return false
}

// Process pending changes when coming back online
async function processPendingChanges(): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) return 0

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return 0
    const userId = session.user.id

    const changes = getPendingChanges()
    if (changes.length === 0) return 0

    console.log(`Processing ${changes.length} pending changes...`)
    updateSyncStatus('syncing')

    let successCount = 0

    for (const change of changes) {
        try {
            if (!change.data) {
                console.warn(`Skipping change ${change.id} due to missing data`)
                removePendingChange(change.id)
                continue
            }

            let success = false

            switch (change.type) {
                case 'add_customer':
                    const { error: addCustError } = await supabase
                        .from('customers')
                        .upsert({ ...toSupabaseCustomer(change.data), user_id: userId }, { onConflict: 'id' })
                    success = !addCustError
                    if (success) markItemAsSynced('customer', change.data.id)
                    break

                case 'update_customer':
                    const { id: custId, ...custUpdates } = change.data
                    const supabaseUpdates: any = {}
                    if (custUpdates.trustStatus !== undefined) supabaseUpdates.trust_status = custUpdates.trustStatus
                    if (custUpdates.bottlesOutstanding !== undefined) supabaseUpdates.bottles_outstanding = custUpdates.bottlesOutstanding
                    if (custUpdates.depositsHeld !== undefined) supabaseUpdates.deposits_held = custUpdates.depositsHeld
                    if (custUpdates.lastTransaction !== undefined) supabaseUpdates.last_transaction = custUpdates.lastTransaction
                    supabaseUpdates.updated_at = new Date().toISOString()
                    supabaseUpdates.user_id = userId // Ensure user_id is set

                    const { error: updateCustError } = await supabase
                        .from('customers')
                        .update(supabaseUpdates)
                        .eq('id', custId)
                        .eq('user_id', userId) // RLS safety
                    success = !updateCustError
                    if (success) markItemAsSynced('customer', custId)
                    break

                case 'delete_customer':
                    const { error: delCustError } = await supabase
                        .from('customers')
                        .delete()
                        .eq('id', change.data.id)
                        .eq('user_id', userId) // RLS safety
                    success = !delCustError
                    break

                case 'add_transaction':
                    const { error: addTxnError } = await supabase
                        .from('transactions')
                        .upsert({ ...toSupabaseTransaction(change.data), user_id: userId }, { onConflict: 'id' })
                    success = !addTxnError
                    if (success) markItemAsSynced('transaction', change.data.id)
                    break

                case 'delete_transaction':
                    const { error: delTxnError } = await supabase
                        .from('transactions')
                        .delete()
                        .eq('id', change.data.id)
                        .eq('user_id', userId) // RLS safety
                    success = !delTxnError
                    break
            }

            if (success) {
                removePendingChange(change.id)
                successCount++
            }
        } catch (e) {
            console.error(`Failed to process change ${change.id}:`, e)
        }
    }

    if (getPendingChanges().length === 0) {
        setLastSyncTime(new Date().toISOString())
        updateSyncStatus('online')
    }

    return successCount
}

// Get pending changes count (for UI indicator)
export function getPendingChangesCount(): number {
    const pendingQueue = getPendingChanges()

    if (typeof window === 'undefined') return pendingQueue.length

    try {
        const customers = JSON.parse(localStorage.getItem('bottletrack_customers') || '[]')
        const transactions = JSON.parse(localStorage.getItem('bottletrack_transactions') || '[]')

        const unsyncedCustomers = customers.filter((c: any) => !c.lastSyncedAt)
        const unsyncedTransactions = transactions.filter((t: any) => !t.lastSyncedAt)

        // Use a Set to count unique IDs that need syncing
        const unsyncedIds = new Set([
            ...pendingQueue.map(c => c.data?.id || c.id),
            ...unsyncedCustomers.map((c: any) => c.id),
            ...unsyncedTransactions.map((t: any) => t.id)
        ])

        return unsyncedIds.size
    } catch {
        return pendingQueue.length
    }
}

// Manual sync trigger
export async function triggerSync(): Promise<boolean> {
    if (!isOnline) return false

    try {
        const pendingCount = getPendingChangesCount()
        if (pendingCount === 0) {
            return false
        }

        const successCount = await processPendingChanges()
        return successCount > 0
    } catch {
        return false
    }
}

// Push all local data to cloud (Initial migration)
export async function pushAllDataToCloud(customers: Customer[], transactions: Transaction[]): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
        return { success: false, error: 'Supabase not configured' }
    }

    if (!isOnline) {
        return { success: false, error: 'Offline' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { success: false, error: 'Not authenticated' }
    const userId = session.user.id

    if (customers.length === 0 && transactions.length === 0) {
        return { success: false, error: 'No data to sync' }
    }

    // Filter for data that actually needs syncing (lastSyncedAt is null)
    const unsyncedCustomers = customers.filter(c => !c.lastSyncedAt)
    const unsyncedTransactions = transactions.filter(t => !t.lastSyncedAt)

    if (unsyncedCustomers.length === 0 && unsyncedTransactions.length === 0) {
        return { success: false, error: 'already_synced' }
    }

    try {
        updateSyncStatus('syncing')

        // 1. Push customers
        if (unsyncedCustomers.length > 0) {
            const supabaseCustomers = unsyncedCustomers.map(c => ({
                ...toSupabaseCustomer(c),
                user_id: userId
            }))
            const { error: custError } = await supabase
                .from('customers')
                .upsert(supabaseCustomers, { onConflict: 'id' })

            if (custError) throw custError
        }

        // 2. Push transactions
        if (unsyncedTransactions.length > 0) {
            const supabaseTransactions = unsyncedTransactions.map(t => ({
                ...toSupabaseTransaction(t),
                user_id: userId
            }))
            const { error: txnError } = await supabase
                .from('transactions')
                .upsert(supabaseTransactions, { onConflict: 'id' })

            if (txnError) throw txnError
        }

        // Mark all pushed items as synced locally
        unsyncedCustomers.forEach(c => markItemAsSynced('customer', c.id))
        unsyncedTransactions.forEach(t => markItemAsSynced('transaction', t.id))

        // Clear the pending changes queue as well
        savePendingChanges([])

        setLastSyncTime(new Date().toISOString())
        updateSyncStatus('online')
        return { success: true }
    } catch (e: any) {
        console.error('Bulk push failed:', e)
        updateSyncStatus('error')
        return { success: false, error: e.message || 'Unknown error' }
    }
}

export async function pullAllDataFromCloud(): Promise<{ success: boolean; customers?: Customer[]; transactions?: Transaction[]; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' }

    try {
        // 1. Fetch all customers
        const { data: customersData, error: customersError } = await supabase
            .from('customers')
            .select('*')

        if (customersError) throw customersError

        // 2. Fetch all transactions
        const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')

        if (transactionsError) throw transactionsError

        // 3. Map back to local types
        const now = new Date().toISOString()

        const customers: Customer[] = (customersData || []).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            trustStatus: c.trust_status,
            bottlesOutstanding: c.bottles_outstanding,
            depositsHeld: Number(c.deposits_held),
            lastTransaction: c.last_transaction,
            lastSyncedAt: now // Mark as synced
        }))

        const transactions: Transaction[] = (transactionsData || []).map(t => ({
            id: t.id,
            customerId: t.customer_id,
            type: t.type as TransactionType,
            category: t.category as BottleCategory,
            brand: t.brand,
            bottleType: t.bottle_type as BottleType,
            bottleCount: t.bottle_count,
            depositAmount: Number(t.deposit_amount),
            items: t.items,
            notes: t.notes,
            timestamp: new Date(t.timestamp),
            lastSyncedAt: now // Mark as synced
        }))

        return { success: true, customers, transactions }
    } catch (e: any) {
        console.error('Failed to pull data from cloud:', e)
        return { success: false, error: e.message || 'Unknown error' }
    }
}
