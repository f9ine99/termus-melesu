// AI Service for transaction summarization
import type { Transaction, Language } from "./types"
import { getCustomers, getTransactions, getDashboardStats } from "./data-store"
import { supabase, isSupabaseConfigured } from "./supabase"
import { hasAiConsent } from "./ai-consent"
import {
  buildMinimizedSummarizePayload,
  sanitizeChatMessage,
  type MinimizedSummarizePayload,
} from "./ai-minimization"

export type SummaryPeriod = "today" | "week" | "month"

interface SummarizeResponse {
  summary: string
  error?: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function getPreviousPeriodTransactions(
  allTransactions: Transaction[],
  period: SummaryPeriod,
): Transaction[] {
  const now = new Date()
  let prevStartDate: Date
  let prevEndDate: Date

  if (period === "today") {
    prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "week") {
    prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    prevEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return allTransactions.filter((t) => {
    const d = new Date(t.timestamp)
    return d >= prevStartDate && d < prevEndDate
  })
}

export function buildMinimizedAiPayload(
  transactions: Transaction[],
  period: SummaryPeriod,
): MinimizedSummarizePayload | null {
  if (transactions.length === 0) return null

  const allTransactions = getTransactions()
  const prevTransactions = getPreviousPeriodTransactions(allTransactions, period)

  return buildMinimizedSummarizePayload(
    transactions,
    getCustomers(),
    period,
    prevTransactions,
    getDashboardStats().totalDepositsHeld,
  )
}

/**
 * Filter transactions by period
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: SummaryPeriod,
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
 * Get AI-powered summary of transactions (minimized payload only; no PII sent to Groq).
 */
export async function getTransactionSummary(
  transactions: Transaction[],
  period: SummaryPeriod,
  language: Language = "en",
  messages: ChatMessage[] = [],
): Promise<SummarizeResponse> {
  try {
    if (!hasAiConsent()) {
      return { summary: "", error: "ai_consent_required" }
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { summary: "", error: "Not authenticated" }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { summary: "", error: "Not authenticated" }
    }

    const minimized = buildMinimizedAiPayload(transactions, period)
    if (!minimized) {
      return { summary: "", error: "No transactions to summarize" }
    }

    const sanitizedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.role === "user" ? sanitizeChatMessage(msg.content) : msg.content,
    }))

    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...minimized,
        period,
        language,
        messages: sanitizedMessages,
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

  const depositIssued = transactions
    .filter((t) => t.type === "issue")
    .reduce((sum, t) => sum + t.depositAmount, 0)

  const depositReturned = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + t.depositAmount, 0)

  const netDepositChange = depositIssued - depositReturned

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

  const topCustomers = Object.values(customerStats)
    .map((c) => ({ ...c, total: c.issued + c.returned }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  return {
    issued,
    returned,
    netChange,
    depositIssued,
    depositReturned,
    netDepositChange,
    topCustomers,
    transactionCount: transactions.length,
  }
}
