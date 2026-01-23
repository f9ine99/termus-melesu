"use client"

import { useMemo, useState, useEffect } from "react"
import { getTransactions, getDashboardStats } from "@/lib/data-store"
import { getTransactionSummary, filterTransactionsByPeriod, type SummaryPeriod } from "@/lib/ai-service"
import ActivityItem from "@/components/ui/activity-item"
import { ArrowLeftIcon, DownloadIcon, ChartIcon, SparkleIcon, XIcon, CopyIcon, CheckIcon, AlertIcon } from "@/components/ui/icons"
import type { Language } from "@/lib/types"

interface ReportsScreenProps {
  onBack: () => void
  onNavigateToAiInsights: (period: SummaryPeriod) => void
  onNavigateToRiskManagement: () => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function ReportsScreen({ onBack, onNavigateToAiInsights, onNavigateToRiskManagement, onNotify, t, language }: ReportsScreenProps) {
  const transactions = useMemo(() => getTransactions(), [])
  const stats = useMemo(() => getDashboardStats(), [])
  const [visibleCount, setVisibleCount] = useState(10)

  const handleExport = () => {
    if (transactions.length === 0) {
      onNotify?.(t("noDataToExport") || "No data to export", "info")
      return
    }

    // CSV Headers
    const headers = ["Date", "Customer", "Type", "Category", "Brand", "Count", "Deposit", "Notes"]

    // CSV Rows
    const rows = transactions.map(txn => [
      new Date(txn.timestamp).toLocaleString(),
      txn.customerName,
      txn.type,
      txn.category,
      txn.brand,
      txn.bottleCount,
      txn.depositAmount,
      `"${(txn.notes || "").replace(/"/g, '""')}"` // Escape quotes in notes
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `transaction_log_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    onNotify?.(t("exportSuccess") || "Data exported successfully", "success")
  }


  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/40 backdrop-blur-2xl z-20">
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
        <button
          onClick={handleExport}
          className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium active:scale-90 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-morphism rounded-[2.5rem] p-6 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary/20 transition-colors" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("totalBorrowed")}</p>
            <p className="text-4xl font-black text-primary tracking-tighter">{stats.totalIssues}</p>
            <div className="h-1.5 w-10 bg-primary/30 rounded-full" />
          </div>
          <div className="glass-morphism rounded-[2.5rem] p-6 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-green-500/20 transition-colors" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("totalReturned")}</p>
            <p className="text-4xl font-black text-green-600 dark:text-green-400 tracking-tighter">{stats.totalReturns}</p>
            <div className="h-1.5 w-10 bg-green-500/30 rounded-full" />
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("aiPowered")}</h3>
            </div>
          </div>


          {/* Generate Button - Enhanced & Professional */}
          <button
            onClick={() => onNavigateToAiInsights("today")}
            className="w-full group relative overflow-hidden rounded-[2rem] bg-card border border-primary/20 p-1 transition-all duration-500 hover:border-primary/40 active:scale-[0.99] shadow-soft"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-[1.8rem] group-hover:from-primary/10 group-hover:to-purple-500/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <SparkleIcon className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black tracking-tight text-foreground">{t("generateSummary")}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("aiPowered")}</span>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeftIcon className="h-4 w-4 rotate-180" />
              </div>
            </div>
          </button>

          {/* Risk Analysis Banner - Relocated & Refined */}
          <button
            onClick={onNavigateToRiskManagement}
            className="w-full group relative overflow-hidden rounded-[2rem] bg-red-500/5 border border-red-500/10 transition-all duration-500 hover:bg-red-500/10 active:scale-[0.99]"
          >
            <div className="relative flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
                  <AlertIcon className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <h3 className="text-sm font-black tracking-tight text-red-600 dark:text-red-400">{t("riskAnalysis") || "Risk Analysis"}</h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground/90">
                    {t("trackOverdueBottles") || "Track Overdue Bottles"}
                  </p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/10 bg-red-500/5 text-red-500 transition-all duration-300 group-hover:bg-red-500 group-hover:text-white">
                <ArrowLeftIcon className="h-4 w-4 rotate-180" />
              </div>
            </div>
          </button>
        </div>


        {/* Full History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("fullHistoryLog")}</h3>
              <p className="text-[9px] font-bold text-muted-foreground/60">{t("showingRecentRecords", { count: Math.min(visibleCount, transactions.length) })}</p>
            </div>
            <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{transactions.length} {t("records")}</span>
          </div>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              <>
                {[...transactions].reverse().slice(0, visibleCount).map((txn) => (
                  <div key={txn.id} className="glass-morphism rounded-[2rem] p-5 shadow-soft hover:border-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.99] group">
                    <ActivityItem transaction={txn} t={t} />
                  </div>
                ))}

                {visibleCount < transactions.length && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="w-full py-4 bg-secondary/30 hover:bg-secondary/50 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all active:scale-[0.98]"
                  >
                    {t("loadMore") || "Load More"}
                  </button>
                )}
              </>
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
