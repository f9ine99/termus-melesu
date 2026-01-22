"use client"

import { useMemo, useState, useEffect } from "react"
import { getDashboardStats, getRecentTransactions } from "@/lib/data-store"
import ActivityItem from "@/components/ui/activity-item"
import { BottleIcon, MoneyIcon, PeopleIcon, AddIcon, ChartIcon, SendIcon, ReceiveIcon, CloudIcon, SparkleIcon, XIcon, CopyIcon, CheckIcon } from "@/components/ui/icons"
import { getTransactionSummary, filterTransactionsByPeriod } from "@/lib/ai-service"
import type { Language } from "@/lib/types"

interface DashboardScreenProps {
  onNavigateToIssue: () => void
  onNavigateToReturn: () => void
  onNavigateToReports: () => void
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
    if (!isoString) return t("neverSynced") || "Never Synced"
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
      {/* Background Accents - Refined */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{t("dashboard")}</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("dashboard")}</p>
          </div>
          <button
            onClick={onNavigateToReports}
            className="p-2 rounded-xl transition-all active:scale-90 relative group hover:bg-primary/10"
            title={t("viewReports")}
          >
            <SparkleIcon className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />

            {/* Subtle Tooltip-like Badge */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest shadow-premium">
              {t("aiPowered")}
            </span>
          </button>
        </div>
        <div
          onClick={onFixSync}
          className={`group flex items-center gap-3 px-5 py-2.5 rounded-[1.5rem] border transition-all duration-700 cursor-pointer active:scale-95 relative overflow-hidden ${syncStatus === 'online' ? 'bg-green-500/5 border-green-500/10 text-green-600 hover:bg-green-500/10 shadow-sm hover:shadow-md' :
            syncStatus === 'syncing' ? 'bg-primary/5 border-primary/10 text-primary hover:bg-primary/10' :
              syncStatus === 'error' ? 'bg-red-500/5 border-red-500/10 text-red-600 hover:bg-red-500/10' :
                'bg-slate-500/5 border-slate-500/10 text-slate-600 hover:bg-slate-500/10'
            }`}
        >
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 backdrop-blur-xl z-0" />

          {/* Syncing Shimmer Effect */}
          {syncStatus === 'syncing' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full animate-shimmer z-1" />
          )}

          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner ${syncStatus === 'online' ? 'bg-green-500/10' :
                syncStatus === 'syncing' ? 'bg-primary/10' :
                  syncStatus === 'error' ? 'bg-red-500/10' :
                    'bg-slate-500/10'
                }`}>
                <CloudIcon className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
              </div>
              <div className={`absolute -right-0.5 -top-0.5 w-3 h-3 rounded-full border-2 border-background z-20 shadow-sm ${syncStatus === 'online' ? 'bg-green-500' :
                syncStatus === 'syncing' ? 'bg-primary animate-pulse' :
                  syncStatus === 'error' ? 'bg-red-500' :
                    'bg-slate-400'
                }`} />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-90">
                {pendingCount > 0 ? 'Sync Required' :
                  syncStatus === 'online' ? 'Cloud Vault' :
                    syncStatus === 'syncing' ? 'Syncing...' :
                      syncStatus === 'error' ? 'Sync Alert' :
                        'Offline'}
              </span>
              <span className="text-[8px] font-bold opacity-60 mt-1 uppercase tracking-widest flex items-center gap-1">
                {pendingCount > 0 ? (
                  <span className="flex items-center gap-1 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending
                  </span>
                ) : (
                  <>
                    <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                    {syncStatus === 'online' ? `Synced ${formatRelativeTime(lastSyncTime)}` :
                      syncStatus === 'syncing' ? 'Processing...' :
                        syncStatus === 'error' ? 'Check Connection' :
                          'Local Only'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Main Stats Card - More Sophisticated */}
        {/* Main Stats Card - Premium Gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-[2.5rem] p-8 shadow-premium relative overflow-hidden group border border-white/10">
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{t("totalOutstanding")}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">{stats.totalBottlesOutstanding}</span>
                  <span className="text-xs font-black uppercase tracking-widest opacity-60">{t("units")}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <BottleIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-8 border-t border-white/10">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">{t("totalDeposits")}</p>
                <p className="text-2xl font-black tracking-tight">ETB {stats.totalDepositsHeld.toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onNavigateToReturn}
                  className="w-14 h-14 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                  title={t("returnBottles")}
                >
                  <ReceiveIcon className="w-7 h-7" />
                </button>
                <button
                  onClick={onNavigateToIssue}
                  className="w-14 h-14 bg-white text-primary rounded-[1.5rem] flex items-center justify-center shadow-xl active:scale-90 transition-all hover:rotate-90"
                  title={t("issueBottles")}
                >
                  <SendIcon className="w-7 h-7" />
                </button>
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
        </div>

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
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("recentActivity")}</h3>
            <button
              onClick={onNavigateToReports}
              className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
            >
              {t("fullHistory")}
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-4 shadow-soft hover:border-primary/20 transition-colors">
                  <ActivityItem transaction={txn} t={t} />
                </div>
              ))
            ) : (
              <div className="py-16 text-center bg-secondary/30 rounded-[2.5rem] border border-dashed border-border">
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
      className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] p-6 text-left shadow-soft active:scale-[0.98] transition-all hover:border-primary/20 hover:bg-card/80 group relative overflow-hidden`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${color} border`}>
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
        <p className="text-xl font-black tracking-tight">{value}</p>
      </div>
    </button>
  )
}
