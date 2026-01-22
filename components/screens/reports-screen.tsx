"use client"

import { useMemo, useState, useEffect } from "react"
import { getTransactions, getDashboardStats } from "@/lib/data-store"
import { getTransactionSummary, filterTransactionsByPeriod, type SummaryPeriod } from "@/lib/ai-service"
import ActivityItem from "@/components/ui/activity-item"
import { ArrowLeftIcon, DownloadIcon, ChartIcon, SparkleIcon, XIcon, CopyIcon, CheckIcon } from "@/components/ui/icons"
import type { Language } from "@/lib/types"

interface ReportsScreenProps {
  onBack: () => void
  onNavigateToAiInsights: (period: SummaryPeriod) => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function ReportsScreen({ onBack, onNavigateToAiInsights, onNotify, t, language }: ReportsScreenProps) {
  const transactions = useMemo(() => getTransactions(), [])
  const stats = useMemo(() => getDashboardStats(), [])

  const [selectedPeriod, setSelectedPeriod] = useState<SummaryPeriod>("today")

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
        <button className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium active:scale-90 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <DownloadIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
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
            onClick={() => onNavigateToAiInsights(selectedPeriod)}
            className="w-full py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-[2rem] font-black text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all hover:brightness-110 hover:shadow-primary/40 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <SparkleIcon className="w-6 h-6 animate-pulse-subtle relative z-10" />
            <span className="tracking-wide uppercase relative z-10">{t("generateSummary")}</span>
          </button>
        </div>


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
