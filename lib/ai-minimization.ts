import type { Customer, Transaction } from "./types"

const MAX_CATEGORY_BREAKDOWN = 8
const MAX_RISK_ALERTS = 5

export interface MinimizedRiskAlert {
  customerLabel: string
  outstanding: number
  daysInactive: number
  trustStatus: Customer["trustStatus"]
}

export interface MinimizedTopCustomer {
  customerLabel: string
  issued: number
  returned: number
  total: number
}

export interface MinimizedQuickStats {
  issued: number
  returned: number
  netChange: number
  depositIssued: number
  depositReturned: number
  netDepositChange: number
  topCustomers: MinimizedTopCustomer[]
  transactionCount: number
}

export interface MinimizedEnhancedContext {
  currentStats: MinimizedQuickStats
  prevStats: MinimizedQuickStats
  riskAlerts: MinimizedRiskAlert[]
  categoryBreakdown: Array<{ category: string; brand: string; issued: number; returned: number }>
  period: string
}

export interface MinimizedSummarizePayload {
  stats: MinimizedQuickStats & { totalDepositsHeld: number }
  enhancedContext: MinimizedEnhancedContext
}

/** Stable pseudonyms per customer id (no real names sent to AI). */
export function buildCustomerPseudonymMap(customerIds: string[]): Map<string, string> {
  const map = new Map<string, string>()
  ;[...new Set(customerIds)].sort().forEach((id, index) => {
    map.set(id, `Customer ${index + 1}`)
  })
  return map
}

export function pseudonymForCustomer(
  customerId: string,
  map: Map<string, string>,
): string {
  return map.get(customerId) ?? "Customer"
}

export function minimizeQuickStats(
  transactions: Transaction[],
  pseudonymMap: Map<string, string>,
): MinimizedQuickStats {
  const issued = transactions
    .filter((t) => t.type === "issue")
    .reduce((sum, t) => sum + t.bottleCount, 0)

  const returned = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + t.bottleCount, 0)

  const depositIssued = transactions
    .filter((t) => t.type === "issue")
    .reduce((sum, t) => sum + t.depositAmount, 0)

  const depositReturned = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + t.depositAmount, 0)

  const customerStats: Record<string, { issued: number; returned: number }> = {}

  for (const t of transactions) {
    if (!customerStats[t.customerId]) {
      customerStats[t.customerId] = { issued: 0, returned: 0 }
    }
    if (t.type === "issue") {
      customerStats[t.customerId].issued += t.bottleCount
    } else if (t.type === "return") {
      customerStats[t.customerId].returned += t.bottleCount
    }
  }

  const topCustomers = Object.entries(customerStats)
    .map(([customerId, stats]) => ({
      customerLabel: pseudonymForCustomer(customerId, pseudonymMap),
      issued: stats.issued,
      returned: stats.returned,
      total: stats.issued + stats.returned,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  return {
    issued,
    returned,
    netChange: issued - returned,
    depositIssued,
    depositReturned,
    netDepositChange: depositIssued - depositReturned,
    topCustomers,
    transactionCount: transactions.length,
  }
}

function buildCategoryBreakdown(transactions: Transaction[]) {
  const breakdown = new Map<string, { category: string; brand: string; issued: number; returned: number }>()

  for (const t of transactions) {
    const key = `${t.category}::${t.brand}`
    const row = breakdown.get(key) ?? {
      category: t.category,
      brand: t.brand,
      issued: 0,
      returned: 0,
    }
    if (t.type === "issue") row.issued += t.bottleCount
    else if (t.type === "return") row.returned += t.bottleCount
    breakdown.set(key, row)
  }

  return [...breakdown.values()]
    .sort((a, b) => b.issued + b.returned - (a.issued + a.returned))
    .slice(0, MAX_CATEGORY_BREAKDOWN)
}

export function minimizeRiskAlerts(
  customers: Customer[],
  pseudonymMap: Map<string, string>,
  options?: { minOutstanding?: number; minDaysInactive?: number },
): MinimizedRiskAlert[] {
  const minOutstanding = options?.minOutstanding ?? 10
  const minDaysInactive = options?.minDaysInactive ?? 7
  const now = Date.now()

  return customers
    .filter((c) => c.bottlesOutstanding > minOutstanding)
    .map((c) => {
      const lastTxnDate = c.lastTransaction ? new Date(c.lastTransaction).getTime() : 0
      const daysInactive = Math.floor((now - lastTxnDate) / (1000 * 60 * 60 * 24))
      return {
        customerLabel: pseudonymForCustomer(c.id, pseudonymMap),
        outstanding: c.bottlesOutstanding,
        daysInactive,
        trustStatus: c.trustStatus,
      }
    })
    .filter((c) => c.daysInactive > minDaysInactive)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, MAX_RISK_ALERTS)
}

export function buildMinimizedSummarizePayload(
  transactions: Transaction[],
  customers: Customer[],
  period: string,
  prevTransactions: Transaction[],
  totalDepositsHeld: number,
): MinimizedSummarizePayload {
  const customerIds = [
    ...transactions.map((t) => t.customerId),
    ...customers.map((c) => c.id),
  ]
  const pseudonymMap = buildCustomerPseudonymMap(customerIds)

  const currentStats = minimizeQuickStats(transactions, pseudonymMap)
  const prevStats = minimizeQuickStats(prevTransactions, pseudonymMap)

  return {
    stats: { ...currentStats, totalDepositsHeld },
    enhancedContext: {
      currentStats,
      prevStats,
      riskAlerts: minimizeRiskAlerts(customers, pseudonymMap),
      categoryBreakdown: buildCategoryBreakdown(transactions),
      period,
    },
  }
}

/** Strip any accidental PII patterns from user chat input before sending to AI. */
export function sanitizeChatMessage(content: string): string {
  return content
    .replace(/\+?\d[\d\s-]{8,}\d/g, "[phone redacted]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]")
    .trim()
    .slice(0, 2000)
}
