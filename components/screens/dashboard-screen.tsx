"use client"

import { useMemo, useState, useEffect } from "react"
import { getDashboardStats, getRecentTransactions } from "@/lib/data-store"
import ActivityItem from "@/components/ui/activity-item"
import { BottleIcon, MoneyIcon, PeopleIcon, AddIcon, ChartIcon, SendIcon, ReceiveIcon, CloudIcon, SparkleIcon, XIcon, CopyIcon, CheckIcon, ArrowLeftIcon, AlertIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/moving-border"
import { getTransactionSummary, filterTransactionsByPeriod } from "@/lib/ai-service"
import type { Language } from "@/lib/types"

interface DashboardScreenProps {
  onNavigateToIssue: () => void
  onNavigateToReturn: () => void
  onNavigateToReports: () => void
  onNavigateToAiInsights: () => void
  onNavigateToSettings: () => void
  onNavigateToCustomers: () => void
  t: (key: any, params?: any) => string
  language: string
  syncStatus: string
  pendingCount: number
  lastSyncTime: string | null
  onFixSync: () => void
}

export default function DashboardScreen({
  onNavigateToIssue,
  onNavigateToReturn,
  onNavigateToReports,
  onNavigateToAiInsights,
  onNavigateToSettings,
  onNavigateToCustomers,
  t,
  language,
  syncStatus,
  pendingCount,
  lastSyncTime,
  onFixSync,
}: DashboardScreenProps) {
  const stats = useMemo(() => getDashboardStats(), [])
  const recentTransactions = useMemo(() => getRecentTransactions(5), [])
  const [now, setNow] = useState(new Date())


  // Update 'now' every 10 seconds to refresh relative time display
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000) // 10 seconds

    return () => clearInterval(timer)
  }, [])

  // Also update 'now' immediately when lastSyncTime changes
  useEffect(() => {
    setNow(new Date())
  }, [lastSyncTime])

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return t("neverSynced")
    const date = new Date(isoString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return t("justNow") || "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      {/* Background Accents - Premium & Subtle */}
      <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-20%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-float" />

      {/* Header */}
      <header className="px-7 pt-14 pb-8 flex items-start justify-between sticky top-0 bg-background z-20">
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-background to-transparent -mb-6 pointer-events-none" />
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <div className="relative group/logo">
              <div className="absolute inset-0 rounded-2xl bg-primary blur-lg opacity-40 group-hover/logo:opacity-60 transition-opacity" />
              <div className="relative w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 border border-white/20">
                <BottleIcon className="w-6 h-6 text-primary-foreground drop-shadow-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[1.75rem] font-black tracking-tight text-primary leading-none">Retra</h1>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Bottle Manager</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          <Button
            onClick={onFixSync}
            borderRadius="1rem"
            containerClassName="rounded-2xl"
            className={`group flex items-center gap-3.5 px-5 py-3 transition-all duration-500 active:scale-95 ${syncStatus === 'online'
              ? 'bg-secondary/50 text-foreground hover:bg-secondary/80'
              : 'bg-primary/10 text-primary'
              }`}
            borderClassName={syncStatus === 'online' ? "bg-[radial-gradient(var(--primary)_0%,transparent_60%)] h-20 w-20 opacity-70" : undefined}
          >
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <CloudIcon className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
                {pendingCount > 0 && (
                  <div className="absolute -right-1 -top-1 w-2 h-2 bg-primary rounded-full border border-background" />
                )}
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                  {syncStatus === 'online' ? t("cloud") : syncStatus === 'offline' ? t("offline") : t("sync")}
                </span>
                {pendingCount > 0 && (
                  <span className="text-[7px] font-bold opacity-70 leading-none">{pendingCount} pending</span>
                )}
              </div>
            </div>
          </Button>
          <div className="flex items-center gap-1.5 opacity-50 pr-0.5">
            <div className={`w-1 h-1 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-[7px] font-medium text-muted-foreground tracking-wide">
              {syncStatus === 'online'
                ? (lastSyncTime ? formatRelativeTime(lastSyncTime) : t("neverSynced"))
                : syncStatus === 'offline'
                  ? t("offline")
                  : t("syncing")
              }
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Main Stats Card - Modern Glassy Design */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 shadow-premium border border-white/20 group">
          {/* Background Patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-24 -mb-24" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">{t("totalOutstanding")}</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black tracking-tighter text-white drop-shadow-sm">{stats.totalBottlesOutstanding}</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/60">{t("units")}</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
                <BottleIcon className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/10">
              <div className="flex flex-col gap-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t("totalDeposits")}</p>
                  <p className="text-2xl font-black tracking-tight text-white">ETB {stats.totalDepositsHeld.toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onNavigateToReturn}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 backdrop-blur-md transition-all active:scale-95 group/btn"
                  >
                    <ReceiveIcon className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{t("return")}</span>
                  </button>
                  <button
                    onClick={onNavigateToIssue}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-primary rounded-2xl shadow-lg shadow-black/10 transition-all active:scale-95 hover:shadow-xl group/btn"
                  >
                    <SendIcon className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{t("issue")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Banner */}
        {/* AI Insights Banner - Professional & Premium */}
        <button
          onClick={onNavigateToAiInsights}
          className="w-full group relative overflow-hidden rounded-[2rem] bg-card border border-primary/20 p-1 transition-all duration-500 hover:border-primary/40 active:scale-[0.99] shadow-soft"
        >
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-[1.8rem] group-hover:from-primary/10 group-hover:to-purple-500/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                <SparkleIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-start">
                <h3 className="text-sm font-black tracking-tight text-foreground">AI Insights</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t("intelligentAnalysis") || "Intelligent Analysis"}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowLeftIcon className="h-4 w-4 rotate-180" />
            </div>
          </div>
        </button>

        {/* Quick Actions Grid - Refined */}
        <div className="grid grid-cols-2 gap-4">
          <QuickActionCard
            icon={<PeopleIcon className="w-5 h-5" />}
            label={t("customers")}
            value={stats.totalCustomers}
            onClick={onNavigateToCustomers}
            color="bg-blue-500/5 text-blue-600 border-blue-200/20"
          />
          <QuickActionCard
            icon={<ChartIcon className="w-5 h-5" />}
            label={t("reports")}
            value={`${stats.todayIssues} ${t("issue")}`}
            onClick={onNavigateToReports}
            color="bg-purple-500/5 text-purple-600 border-purple-200/20"
          />
        </div>

        {/* Recent Activity - Professional List */}


        {/* Recent Activity - Professional List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground/80">{t("recentActivity")}</h3>
            </div>
            <button
              onClick={onNavigateToReports}
              className="group flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-2xl hover:bg-primary/10 transition-all active:scale-95"
            >
              {t("fullHistory")}
              <ArrowLeftIcon className="w-3 h-3 rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden shadow-soft">
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-border/30">
                {recentTransactions.map((txn) => (
                  <div key={txn.id} className="p-4 hover:bg-primary/5 transition-colors cursor-pointer">
                    <ActivityItem transaction={txn} t={t} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                  <ChartIcon className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t("noActivity")}</p>
              </div>
            )}
          </div>
        </div>


      </main>
    </div >
  )
}

function QuickActionCard({ icon, label, value, onClick, color }: { icon: any, label: string, value: string | number, onClick: () => void, color: string }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start p-6 rounded-[2rem] bg-card/40 backdrop-blur-md border border-border/50 shadow-soft transition-all duration-500 hover:bg-card/60 hover:border-primary/20 active:scale-[0.98] overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150" />

      <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${color} border border-current/10 shadow-sm`}>
        {icon}
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">{label}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <ArrowLeftIcon className="w-3 h-3 text-primary rotate-180" />
        </div>
      </div>
    </button>
  )
}
