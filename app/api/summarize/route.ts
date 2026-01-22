// API Route for Groq-powered transaction summarization
import { NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// System prompt for the AI summarizer
const SYSTEM_PROMPT = `You are "Termus Melesu AI", a specialized business analyst for Ethiopian retail shopkeepers. 
Your goal is to provide ultra-concise, "slim" summaries of bottle return transactions.

Context:
- "Issue": Bottles loaned to customers.
- "Return": Bottles brought back.
- "Outstanding": The debt of bottles a customer owes.

Guidelines:
1. Language: ALWAYS respond in the language requested (English or Amharic).
2. Tone: Professional, direct, and extremely concise.
3. Formatting: Use Markdown (bolding, bullet points). Keep it "slim" for small mobile screens.
4. Structure: Follow a strict, compact structure. No fluff.`

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

interface SummarizeRequest {
    transactions: TransactionData[]
    period: "today" | "week" | "month" | "custom"
    language: "en" | "am"
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
        const { transactions, period, language } = body

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

        const userPrompt = `${languageInstruction}

Provide a slim, structured summary of these ${periodLabel} transactions:

${JSON.stringify(transactions, null, 2)}

Strict Output Format:
**Summary**: [1 sentence overview]
**Metrics**:
- Issued: [Total]
- Returned: [Total]
- Net: [Change]
**Top Customers**: [Name (Net Change), ...]
**Alert**: [1 short actionable insight]`

        // Call Groq API
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },
                    {
                        role: "user",
                        content: userPrompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 1024,
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
