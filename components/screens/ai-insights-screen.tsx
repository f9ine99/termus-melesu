"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { getTransactions } from "@/lib/data-store"
import { getTransactionSummary, filterTransactionsByPeriod, type SummaryPeriod } from "@/lib/ai-service"
import { ArrowLeftIcon, SparkleIcon, CopyIcon, CheckIcon, XIcon, RefreshIcon, ChartIcon, InfoIcon, SendIcon } from "@/components/ui/icons"
import type { Language } from "@/lib/translations"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
    role: "user" | "assistant"
    content: string
}

interface AiInsightsScreenProps {
    onBack: () => void
    onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
    initialPeriod?: SummaryPeriod
    t: (key: any, params?: any) => string
    language: Language
}

export default function AiInsightsScreen({ onBack, onNotify, initialPeriod = "today", t, language }: AiInsightsScreenProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<SummaryPeriod>(initialPeriod)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState("")
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const allTransactions = useMemo(() => getTransactions(), [])

    const filteredTransactions = useMemo(() =>
        filterTransactionsByPeriod(allTransactions, selectedPeriod),
        [allTransactions, selectedPeriod]
    )

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, summaryLoading])

    const handleGenerateSummary = async (isFollowUp = false) => {
        if (!isFollowUp && filteredTransactions.length === 0) {
            setSummaryError(t("noTransactionsForPeriod") || "No transactions found for this period.")
            setMessages([])
            return
        }

        const currentInput = chatInput.trim()
        if (isFollowUp && !currentInput) return

        setSummaryLoading(true)
        setSummaryError(null)

        let newMessages = [...messages]
        if (isFollowUp) {
            newMessages.push({ role: "user", content: currentInput })
            setMessages(newMessages)
            setChatInput("")
        }

        const result = await getTransactionSummary(
            filteredTransactions,
            selectedPeriod,
            language,
            newMessages
        )

        if (result.error) {
            setSummaryError(result.error)
        } else {
            if (isFollowUp) {
                setMessages([...newMessages, { role: "assistant", content: result.summary }])
            } else {
                setMessages([{ role: "assistant", content: result.summary }])
            }
        }

        setSummaryLoading(false)
    }

    // Clear summary when period changes to avoid confusion
    useEffect(() => {
        setMessages([])
        setSummaryError(null)
    }, [selectedPeriod])

    const handleCopySummary = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text)
            } else {
                const textArea = document.createElement("textarea")
                textArea.value = text
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                textArea.style.top = "0"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            if (onNotify) onNotify(t("copiedToClipboard") || "Copied to clipboard", "success")
        } catch (err) {
            console.error('Failed to copy text: ', err)
            if (onNotify) onNotify("Failed to copy to clipboard", "error")
        }
    }

    return (
        <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-background/60 backdrop-blur-xl z-20">
                <button
                    onClick={onBack}
                    className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-foreground" />
                </button>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        {t("aiInsights") || "AI Insights"}
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                        {t("intelligentAnalysis") || "Intelligent Analysis"}
                    </p>
                </div>
            </header>

            <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
                {/* Period Selector - Premium */}
                <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-2 flex gap-2 shadow-soft">
                    {(["today", "week", "month"] as SummaryPeriod[]).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`flex-1 py-4 px-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-wider transition-all duration-500 ${selectedPeriod === period
                                ? "bg-primary text-primary-foreground shadow-premium scale-[1.02]"
                                : "text-muted-foreground hover:bg-secondary/50"
                                }`}
                            style={{ wordSpacing: '0.1em' }}
                        >
                            {t(period === "today" ? "today" : period === "week" ? "thisWeek" : "thisMonth")}
                        </button>
                    ))}
                </div>

                {/* Analysis Content */}
                <div className="space-y-6">
                    {messages.length === 0 && !summaryLoading && !summaryError ? (
                        <div className="py-24 text-center space-y-8 animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-secondary/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner-soft group">
                                <SparkleIcon className="w-12 h-12 text-muted-foreground/40 group-hover:text-primary transition-colors duration-500" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-foreground tracking-tight">{t("readyToAnalyze") || "Ready to Analyze"}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                                    {t("selectPeriodToStart") || "Select a period above to generate your intelligent business summary."}
                                </p>
                            </div>
                            <button
                                onClick={() => handleGenerateSummary(false)}
                                className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-premium active:scale-95 transition-all"
                                style={{ wordSpacing: '0.2em' }}
                            >
                                {t("generateNow") || "Generate Now"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                >
                                    <div
                                        className={`max-w-[90%] p-6 rounded-[2rem] shadow-premium relative group ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-card/50 backdrop-blur-sm border border-border/50 rounded-tl-none"
                                            }`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <ChartIcon className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground" style={{ wordSpacing: '0.1em' }}>AI Insight</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCopySummary(msg.content)}
                                                    className="p-2 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl transition-all active:scale-90"
                                                >
                                                    {copied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        )}
                                        <div className={`text-[14px] leading-relaxed font-medium tracking-tight ${msg.role === "user" ? "text-primary-foreground" : "text-foreground/90"}`}>
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {summaryLoading && (
                                <div className="flex flex-col items-start animate-in fade-in duration-500">
                                    <div className="bg-card/30 backdrop-blur-sm border border-border/30 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground" style={{ wordSpacing: '0.1em' }}>AI is thinking...</span>
                                    </div>
                                </div>
                            )}

                            {summaryError && (
                                <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-[2rem] text-center space-y-4">
                                    <p className="text-xs font-bold text-destructive">{summaryError}</p>
                                    <button
                                        onClick={() => handleGenerateSummary(messages.length > 0)}
                                        className="px-4 py-2 bg-secondary text-foreground rounded-xl text-[10px] font-black uppercase tracking-wider"
                                        style={{ wordSpacing: '0.1em' }}
                                    >
                                        {t("tryAgain") || "Try Again"}
                                    </button>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>
            </main>

            {/* Chat Input - Fixed at bottom */}
            {messages.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-30">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl group-focus-within:bg-primary/10 transition-all duration-500" />
                        <div className="relative flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border/50 p-2 rounded-[2rem] shadow-premium">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleGenerateSummary(true)}
                                placeholder={t("askFollowUp") || "Ask a follow-up question..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50"
                            />
                            <button
                                onClick={() => handleGenerateSummary(true)}
                                disabled={summaryLoading || !chatInput.trim()}
                                className={`p-3 rounded-2xl transition-all duration-300 ${chatInput.trim() && !summaryLoading
                                    ? "bg-primary text-primary-foreground shadow-premium scale-105 active:scale-95"
                                    : "bg-secondary text-muted-foreground/30"
                                    }`}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


