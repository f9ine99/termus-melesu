"use client"

import { useMemo, useState, useEffect } from "react"
import { getTransactions, getDashboardStats } from "@/lib/data-store"
import { getTransactionSummary, filterTransactionsByPeriod, type SummaryPeriod } from "@/lib/ai-service"
import ActivityItem from "@/components/ui/activity-item"
import { ArrowLeftIcon, DownloadIcon, ChartIcon, SparkleIcon, XIcon, CopyIcon, CheckIcon } from "@/components/ui/icons"
import type { Language } from "@/lib/types"

interface ReportsScreenProps {
  onBack: () => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function ReportsScreen({ onBack, onNotify, t, language }: ReportsScreenProps) {
  const transactions = useMemo(() => getTransactions(), [])
  const stats = useMemo(() => getDashboardStats(), [])

  // AI Summary state
  const [showSummary, setShowSummary] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryText, setSummaryText] = useState("")
  const [summaryError, setSummaryError] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<SummaryPeriod>("today")

  // Body scroll locking when modal is open
  useEffect(() => {
    if (showSummary) {
      document.body.classList.add("lock-scroll")
    } else {
      document.body.classList.remove("lock-scroll")
    }
    return () => document.body.classList.remove("lock-scroll")
  }, [showSummary])

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    setSummaryError("")
    setSummaryText("")

    const filteredTransactions = filterTransactionsByPeriod(transactions, selectedPeriod)

    if (filteredTransactions.length === 0) {
      setSummaryError(t("noTransactionsToSummarize"))
      setSummaryLoading(false)
      setShowSummary(true)
      return
    }

    const result = await getTransactionSummary(
      filteredTransactions,
      selectedPeriod,
      language as Language
    )

    if (result.error) {
      setSummaryError(result.error)
    } else {
      setSummaryText(result.summary)
    }

    setSummaryLoading(false)
    setShowSummary(true)
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (onNotify) onNotify(t("copiedToClipboard") || "Copied to clipboard", "success")
  }

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/40 backdrop-blur-2xl z-20 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl active:scale-90 transition-all hover:bg-secondary/80"
          >
            <ArrowLeftIcon className="w-5 h-5 text-foreground" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">{t("reports")}</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">{t("systemReports")}</p>
          </div>
        </div>
        <button className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium active:scale-90 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <DownloadIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-morphism rounded-[2.5rem] p-6 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary/20 transition-colors" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("issuedToday")}</p>
            <p className="text-4xl font-black text-primary tracking-tighter">{stats.todayIssues}</p>
            <div className="h-1.5 w-10 bg-primary/30 rounded-full" />
          </div>
          <div className="glass-morphism rounded-[2.5rem] p-6 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-green-500/20 transition-colors" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("returnedToday")}</p>
            <p className="text-4xl font-black text-green-600 dark:text-green-400 tracking-tighter">{stats.todayReturns}</p>
            <div className="h-1.5 w-10 bg-green-500/30 rounded-full" />
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("aiSummary")}</h3>
            </div>
            <span className="text-[9px] font-black bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <SparkleIcon className="w-3 h-3" />
              {t("aiPowered")}
            </span>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {(["today", "week", "month"] as SummaryPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${selectedPeriod === period
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "bg-secondary/50 text-muted-foreground border border-border hover:border-primary/30"
                  }`}
              >
                {t(period === "today" ? "today" : period === "week" ? "thisWeek" : "thisMonth")}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="w-full py-5 bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-white rounded-[2rem] font-black text-sm shadow-premium active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {summaryLoading && (
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            )}
            {summaryLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="tracking-wide">{t("generatingSummary")}</span>
              </>
            ) : (
              <>
                <SparkleIcon className="w-6 h-6 animate-pulse-subtle" />
                <span className="tracking-wide uppercase">{t("generateSummary")}</span>
              </>
            )}
          </button>
        </div>

        {/* AI Summary Modal */}
        {showSummary && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-card/90 backdrop-blur-2xl w-full slim-modal max-h-[80vh] border border-white/20 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl shadow-inner-soft">
                    <SparkleIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground tracking-tight">{t("aiSummary")}</h3>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-70">
                      {t(selectedPeriod === "today" ? "today" : selectedPeriod === "week" ? "thisWeek" : "thisMonth")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-2 hover:bg-secondary/80 rounded-xl transition-all active:scale-90 border border-transparent hover:border-border/50"
                >
                  <XIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 slim-scrollbar momentum-scroll overscroll-contain touch-pan-y">
                {summaryError ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <XIcon className="w-10 h-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-destructive font-black text-lg">{t("error")}</p>
                      <p className="text-muted-foreground text-sm max-w-[250px] mx-auto leading-relaxed">{summaryError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm font-medium tracking-tight">
                        {summaryText}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCopySummary}
                        className="flex-1 py-3 bg-secondary/80 hover:bg-secondary text-foreground rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-2 border border-border/50"
                      >
                        {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        {copied ? t("copied") || "Copied!" : t("copySummary") || "Copy Summary"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border/50 bg-secondary/10">
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-full py-3 bg-foreground text-background rounded-xl font-black text-xs hover:opacity-90 transition-all active:scale-[0.98] shadow-premium"
                >
                  {t("closeSummary")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("fullHistoryLog")}</h3>
            <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{transactions.length} {t("records")}</span>
          </div>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              [...transactions].reverse().map((txn) => (
                <div key={txn.id} className="glass-morphism rounded-[2rem] p-5 shadow-soft hover:border-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.99] group">
                  <ActivityItem transaction={txn} t={t} />
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-6 glass-morphism rounded-[3rem] border-dashed">
                <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto opacity-50 animate-pulse-subtle">
                  <ChartIcon className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground tracking-tight">{t("noData")}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("noActivity")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
