// AI Service for transaction summarization
import type { Transaction, Language, Customer } from "./types"
import { getCustomers, getTransactions } from "./data-store"

export type SummaryPeriod = "today" | "week" | "month"

interface SummarizeResponse {
    summary: string
    error?: string
}

/**
 * Filter transactions by period
 */
export function filterTransactionsByPeriod(
    transactions: Transaction[],
    period: SummaryPeriod
): Transaction[] {
    const now = new Date()
    let startDate: Date

    switch (period) {
        case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
        case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
        case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
        default:
            startDate = new Date(0)
    }

    return transactions.filter((t) => new Date(t.timestamp) >= startDate)
}

/**
 * Get enhanced context for AI (Trends, Risk, Inventory)
 */
export function getEnhancedContext(transactions: Transaction[], period: SummaryPeriod) {
    const allTransactions = getTransactions()
    const now = new Date()

    // 1. Trend Analysis (Compare with previous period)
    let prevStartDate: Date
    let prevEndDate: Date

    if (period === "today") {
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === "week") {
        prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        prevEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else { // month
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const prevTransactions = allTransactions.filter((t: Transaction) => {
        const d = new Date(t.timestamp)
        return d >= prevStartDate && d < prevEndDate
    })

    const currentStats = getQuickStats(transactions)
    const prevStats = getQuickStats(prevTransactions)

    // 2. Customer Risk Alerts (High outstanding + Inactivity)
    const customers = getCustomers()
    const riskAlerts = customers
        .filter((c: Customer) => c.bottlesOutstanding > 10) // Threshold for risk
        .map((c: Customer) => {
            const lastTxnDate = c.lastTransaction ? new Date(c.lastTransaction) : new Date(0)
            const daysInactive = Math.floor((now.getTime() - lastTxnDate.getTime()) / (1000 * 60 * 60 * 24))
            return {
                name: c.name,
                outstanding: c.bottlesOutstanding,
                daysInactive,
                trustStatus: c.trustStatus
            }
        })
        .filter((c: any) => c.daysInactive > 7) // Inactive for more than a week
        .sort((a: any, b: any) => b.outstanding - a.outstanding)
        .slice(0, 5)

    return {
        currentStats,
        prevStats,
        riskAlerts,
        period
    }
}

/**
 * Get AI-powered summary of transactions
 */
export async function getTransactionSummary(
    transactions: Transaction[],
    period: SummaryPeriod,
    language: Language = "en",
    messages: any[] = []
): Promise<SummarizeResponse> {
    try {
        // Prepare transaction data for API
        const transactionData = transactions.map((t) => ({
            id: t.id,
            customerName: t.customerName || "Unknown",
            type: t.type,
            category: t.category,
            brand: t.brand,
            bottleCount: t.bottleCount,
            depositAmount: t.depositAmount,
            timestamp: typeof t.timestamp === "string"
                ? t.timestamp
                : t.timestamp.toISOString(),
        }))

        // Get Enhanced Context (Trends, Risk, Inventory)
        const enhancedContext = getEnhancedContext(transactions, period)

        const response = await fetch("/api/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                transactions: transactionData,
                stats: enhancedContext.currentStats, // Keep for backward compatibility
                enhancedContext,
                period,
                language,
                messages,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to get summary")
        }

        const data = await response.json()
        return { summary: data.summary }
    } catch (error) {
        console.error("AI summary error:", error)
        return {
            summary: "",
            error: error instanceof Error ? error.message : "Failed to generate summary",
        }
    }
}

/**
 * Quick stats calculation (fallback if AI fails)
 */
export function getQuickStats(transactions: Transaction[]) {
    const issued = transactions
        .filter((t) => t.type === "issue")
        .reduce((sum, t) => sum + t.bottleCount, 0)

    const returned = transactions
        .filter((t) => t.type === "return")
        .reduce((sum, t) => sum + t.bottleCount, 0)

    const netChange = issued - returned

    // Group by customer
    const customerStats: Record<string, { name: string; issued: number; returned: number }> = {}

    transactions.forEach((t) => {
        const name = t.customerName || "Unknown"
        if (!customerStats[t.customerId]) {
            customerStats[t.customerId] = { name, issued: 0, returned: 0 }
        }
        if (t.type === "issue") {
            customerStats[t.customerId].issued += t.bottleCount
        } else {
            customerStats[t.customerId].returned += t.bottleCount
        }
    })

    // Top customers by activity
    const topCustomers = Object.values(customerStats)
        .map((c) => ({ ...c, total: c.issued + c.returned }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)

    return {
        issued,
        returned,
        netChange,
        topCustomers,
        transactionCount: transactions.length,
    }
}
