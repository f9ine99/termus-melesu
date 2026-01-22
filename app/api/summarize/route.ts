// API Route for Groq-powered transaction summarization
import { NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// System prompt for the AI summarizer
const SYSTEM_PROMPT = `You are "Termus Melesu AI", a professional business analyst for retail shopkeepers in Ethiopia. 
Your goal is to provide concise, high-impact summaries of bottle return transactions.

Context:
- "Issue": Bottles loaned to customers.
- "Return": Bottles brought back.
- "Outstanding": The debt of bottles a customer owes.

Guidelines:
1. Language: ALWAYS respond in the language requested (English or Amharic).
2. Tone: Professional and direct.
3. Formatting: Use Markdown (bolding, bullet points).
4. Brevity: Be concise. Focus on key numbers and critical insights. Avoid long explanations.`



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
        const { transactions, period, language, messages = [] } = body

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

Provide a concise summary of these ${periodLabel} transactions:

${JSON.stringify(transactions, null, 2)}

Output Structure:
1. **Overview**: 1 clear sentence on overall activity.
2. **Metrics**: Issued, Returned, Net change, and **Deposited Cash** (just the numbers).
3. **Top Customers**: Most active customers (name and net change).
4. **Insight**: 1 critical actionable insight or alert.`

            finalMessages = [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ]
        } else {
            // For follow-up chat, include the transaction context in the system prompt or as a hidden first message
            const contextMessage = `Context: These are the transactions for ${periodLabel}: ${JSON.stringify(transactions, null, 2)}`

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
                model: "llama-3.3-70b-versatile",
                messages: finalMessages,
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
