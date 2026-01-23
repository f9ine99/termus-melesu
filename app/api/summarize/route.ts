// API Route for Groq-powered transaction summarization
import { NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// System prompt for the AI summarizer
const SYSTEM_PROMPT = `You are "Termus Melesu AI", a highly precise Strategic Business Advisor for retail shopkeepers in Ethiopia. 
Your primary directive is to provide EXECUTIVE-LEVEL insights that validate business programs and highlight strategic risks.

Context & Terminology:
- "Borrowed Bottles": Inventory loaned to customers (previously "Issue").
- "Returned Bottles": Inventory brought back by customers (previously "Return").
- "Inventory Balance Change": The net difference between borrowed and returned items (previously "Net Change").
- "Bottle Deposit": Cash held as security for borrowed bottles (previously "Deposit Amount").

Strict Guidelines:
1. DATA INTEGRITY: Use ONLY the provided "Verified Stats" and "Enhanced Context" for reporting.
2. NO HALLUCINATION: If information is missing, do not invent it.
3. STRATEGIC ANALYSIS:
   - Executive Summary: Focus on WHY the data matters. Frame results as program validation (e.g., "validating initial customer adoption", "cash-control mechanisms").
   - Key Metrics: Use professional labels (Gross vs Net). "Net Inventory Exposure" signals risk awareness.
   - Risk & Alerts: Even if no risks are found, provide a mature assessment (e.g., "All outstanding bottles remain within acceptable return windows").
4. LANGUAGE: ALWAYS respond in the language requested (English or Amharic).
5. TONE: Professional, executive, and direct. Avoid casual or purely operational language.
6. FORMATTING: Use Markdown (bolding, bullet points). DO NOT use tables in the "Key Metrics" section; use bullet points instead.`



interface TransactionData {
    id: string
    customerName: string
    type: "issue" | "return"
    category: string
    brand: string
    bottleCount: number
    depositAmount: number
    timestamp: string
}

interface ChatMessage {
    role: "user" | "assistant" | "system"
    content: string
}

interface SummarizeRequest {
    transactions: TransactionData[]
    stats: any // Pre-calculated stats
    enhancedContext?: any // Trends, Risk
    period: "today" | "week" | "month" | "custom"
    language: "en" | "am"
    messages?: ChatMessage[] // Optional messages for chat history
}

export async function POST(request: NextRequest) {
    try {
        // Check API key
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { error: "Groq API key not configured" },
                { status: 500 }
            )
        }

        const body: SummarizeRequest = await request.json()
        const { transactions, stats, enhancedContext, period, language, messages = [] } = body

        if (!transactions || transactions.length === 0) {
            return NextResponse.json(
                { error: "No transactions to summarize" },
                { status: 400 }
            )
        }

        // Build the prompt with transaction data
        const periodLabel = {
            today: language === "am" ? "ዛሬ" : "Today",
            week: language === "am" ? "ባለፈው ሳምንት" : "This Week",
            month: language === "am" ? "ባለፈው ወር" : "This Month",
            custom: language === "am" ? "የተመረጠ ጊዜ" : "Selected Period",
        }[period]

        const languageInstruction = language === "am"
            ? "Respond in Amharic (አማርኛ)."
            : "Respond in English."

        // If this is the first message (no history), create the initial summary prompt
        let finalMessages: ChatMessage[] = []

        if (messages.length === 0) {
            const userPrompt = `${languageInstruction}

Provide a precise and strategic summary for ${periodLabel} based on this data:

### 1. Verified Stats (Ground Truth):
- Total Borrowed Bottles: ${stats.issued}
- Total Returned Bottles: ${stats.returned}
- Inventory Balance Change: ${stats.netChange}
- Bottle Deposits Collected (Period): ${stats.netDepositChange}
- Total Bottle Deposits Held (Current): ${stats.totalDepositsHeld}
- Total Transaction Count: ${stats.transactionCount}

### 2. Trend Analysis:
- Previous Period Stats: ${JSON.stringify(enhancedContext?.prevStats || "N/A")}
- Growth/Decline: Compare current vs previous.

### 3. Customer Risk Alerts:
${enhancedContext?.riskAlerts?.length > 0
                    ? enhancedContext.riskAlerts.map((c: any) => `- ${c.name}: ${c.outstanding} bottles, inactive for ${c.daysInactive} days`).join("\n")
                    : "No high-risk customers identified."}

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
                { role: "user", content: userPrompt }
            ]
        } else {
            // For follow-up chat, include the full context
            const contextMessage = `Verified Stats: ${JSON.stringify(stats)}
Enhanced Context (Trends, Risk): ${JSON.stringify(enhancedContext)}
Transaction Data: ${JSON.stringify(transactions)}`

            finalMessages = [
                { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextMessage}` },
                ...messages
            ]
        }

        // Call Groq API
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
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

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            )
        }

        const data = await response.json()
        const summary = data.choices?.[0]?.message?.content || "Unable to generate summary"

        return NextResponse.json({ summary })
    } catch (error) {
        console.error("Summarize API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
