"use client"

import { useMemo } from "react"
import { getTransactions, getDashboardStats } from "@/lib/data-store"
import ActivityItem from "@/components/ui/activity-item"
import { ArrowLeftIcon, DownloadIcon, ChartIcon } from "@/components/ui/icons"

interface ReportsScreenProps {
  onBack: () => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function ReportsScreen({ onBack, onNotify, t, language }: ReportsScreenProps) {
  const transactions = useMemo(() => getTransactions(), [])
  const stats = useMemo(() => getDashboardStats(), [])

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
          >
            <ArrowLeftIcon className="w-5 h-5 text-foreground" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{t("reports")}</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("systemReports")}</p>
          </div>
        </div>
        <button className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium active:scale-90 transition-transform">
          <DownloadIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 shadow-soft space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("issuedToday")}</p>
            <p className="text-3xl font-black text-primary tracking-tight">{stats.todayIssues}</p>
            <div className="h-1 w-8 bg-primary/20 rounded-full" />
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 shadow-soft space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("returnedToday")}</p>
            <p className="text-3xl font-black text-green-600 tracking-tight">{stats.todayReturns}</p>
            <div className="h-1 w-8 bg-green-500/20 rounded-full" />
          </div>
        </div>

        {/* Full History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("fullHistoryLog")}</h3>
            <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{transactions.length} {t("records")}</span>
          </div>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              [...transactions].reverse().map((txn) => (
                <div key={txn.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-4 shadow-soft hover:border-primary/20 transition-colors">
                  <ActivityItem transaction={txn} t={t} />
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-6 bg-secondary/20 rounded-[3rem] border border-dashed border-border">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto opacity-50">
                  <ChartIcon className="w-10 h-10 text-muted-foreground" />
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
