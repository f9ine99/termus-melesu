// API Route for Groq-powered transaction summarization
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { MinimizedEnhancedContext, MinimizedQuickStats } from "@/lib/ai-minimization"
import { sanitizeChatMessage } from "@/lib/ai-minimization"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const SYSTEM_PROMPT = `You are "Retra AI", a highly precise Strategic Business Advisor for retail shopkeepers in Ethiopia. 
Your creator is f9ine99.

Identity Guidelines:
- If asked "Who are you?", respond with "I'm Retra AI built by f9ine99 to help the Retra bottle management system".

Your primary directive is to provide EXECUTIVE-LEVEL insights that validate business programs and highlight strategic risks.

Context & Terminology:
- "Borrowed Bottles": Inventory loaned to customers (previously "Issue").
- "Returned Bottles": Inventory brought back by customers (previously "Return").
- "Inventory Balance Change": The net difference between borrowed and returned items (previously "Net Change").
- "Bottle Deposit": Cash held as security for borrowed bottles (previously "Deposit Amount").
- Customer labels like "Customer 1" are pseudonyms; do not invent real identities.

Strict Guidelines:
1. DATA INTEGRITY: Use ONLY the provided "Verified Stats" and "Enhanced Context" for reporting.
2. NO HALLUCINATION: If information is missing, do not invent it.
3. STRATEGIC ANALYSIS:
   - Executive Summary: Focus on WHY the data matters. Frame results as program validation (e.g., "validating initial customer adoption", "cash-control mechanisms").
   - Key Metrics: Use professional labels (Gross vs Net). "Net Inventory Exposure" signals risk awareness.
   - Risk & Alerts: Even if no risks are found, provide a mature assessment (e.g., "All outstanding bottles remain within acceptable return windows").
4. LANGUAGE: ALWAYS respond in english language requested.
5. TONE: Professional, executive, and direct. Avoid casual or purely operational language.
6. FORMATTING: Use Markdown (bolding, bullet points). DO NOT use tables in the "Key Metrics" section; use bullet points instead.`

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface SummarizeRequest {
  stats: MinimizedQuickStats & { totalDepositsHeld: number }
  enhancedContext: MinimizedEnhancedContext
  period: "today" | "week" | "month" | "custom"
  language: "en" | "am"
  messages?: ChatMessage[]
}

function formatRiskAlerts(context: MinimizedEnhancedContext): string {
  if (!context.riskAlerts.length) {
    return "No high-risk customers identified."
  }

  return context.riskAlerts
    .map(
      (c) =>
        `- ${c.customerLabel}: ${c.outstanding} bottles outstanding, inactive for ${c.daysInactive} days (${c.trustStatus} trust)`,
    )
    .join("\n")
}

function formatCategoryBreakdown(context: MinimizedEnhancedContext): string {
  if (!context.categoryBreakdown.length) {
    return "No category breakdown available."
  }

  return context.categoryBreakdown
    .map((row) => `- ${row.category} / ${row.brand}: ${row.issued} issued, ${row.returned} returned`)
    .join("\n")
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })
    }

    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.slice("Bearer ".length).trim()
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    const body: SummarizeRequest = await request.json()
    const { stats, enhancedContext, period, language, messages = [] } = body

    if (!stats || stats.transactionCount === 0) {
      return NextResponse.json({ error: "No transactions to summarize" }, { status: 400 })
    }

    const periodLabel = {
      today: language === "am" ? "ዛሬ" : "Today",
      week: language === "am" ? "ባለፈው ሳምንት" : "This Week",
      month: language === "am" ? "ባለፈው ወር" : "This Month",
      custom: language === "am" ? "የተመረጠ ጊዜ" : "Selected Period",
    }[period]

    const languageInstruction = language === "am"
      ? "Respond in Amharic (አማርኛ)."
      : "Respond in English."

    let finalMessages: ChatMessage[] = []

    if (messages.length === 0) {
      const userPrompt = `${languageInstruction}

Provide a precise and strategic summary for ${periodLabel} based on this minimized business data (customer names are pseudonymized):

### 1. Verified Stats (Ground Truth):
- Total Borrowed Bottles: ${stats.issued}
- Total Returned Bottles: ${stats.returned}
- Inventory Balance Change: ${stats.netChange}
- Bottle Deposits Collected (Period): ${stats.netDepositChange}
- Total Bottle Deposits Held (Current): ${stats.totalDepositsHeld}
- Total Transaction Count: ${stats.transactionCount}

### 2. Trend Analysis:
- Previous Period Stats: ${JSON.stringify(enhancedContext.prevStats)}
- Growth/Decline: Compare current vs previous.

### 3. Category Breakdown:
${formatCategoryBreakdown(enhancedContext)}

### 4. Customer Risk Alerts (pseudonymized):
${formatRiskAlerts(enhancedContext)}

### 5. Top Active Customers (pseudonymized):
${stats.topCustomers.map((c) => `- ${c.customerLabel}: ${c.issued} issued, ${c.returned} returned`).join("\n") || "None"}

Output Structure:
1. **Executive Summary**: 2-3 sentences focusing on strategic performance, program validation, and trends.
2. **Key Metrics (${periodLabel} Performance)**: 
   - Gross Bottles Issued: ${stats.issued}
   - Bottles Returned: ${stats.returned}
   - Net Inventory Exposure: ${stats.netChange > 0 ? `+${stats.netChange}` : stats.netChange} bottles
   - Bottle Deposits Collected (This Period): ${stats.netDepositChange} ETB
   - Bottle Deposits Held (Cumulative): ${stats.totalDepositsHeld} ETB
   - Total Customer Transactions: ${stats.transactionCount}
3. **Risk & Alerts**: Detailed assessment of customer risks or reassurance of program stability.
4. **Actionable Insight**: 1 high-impact strategic recommendation.`

      finalMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ]
    } else {
      const contextMessage = `Verified Stats: ${JSON.stringify(stats)}
Enhanced Context: ${JSON.stringify(enhancedContext)}`

      finalMessages = [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextMessage}` },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.role === "user" ? sanitizeChatMessage(msg.content) : msg.content,
        })),
      ]
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: finalMessages,
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        reasoning_effort: "medium",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Groq API error:", errorData)
      const errorMessage = errorData.error?.message || "Failed to generate summary"
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary"

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Summarize API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
