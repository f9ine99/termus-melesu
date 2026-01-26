"use client"

import { useState, useMemo } from "react"
import { getCustomerById, getCustomerTransactions, updateCustomerTrustStatus, deleteTransaction } from "@/lib/data-store"
import { getStoredSession } from "@/lib/auth-store"
import ActivityItem from "@/components/ui/activity-item"
import { ArrowLeftIcon, BottleIcon, MoneyIcon, AddIcon, SendIcon, ReceiveIcon, CheckIcon, XIcon, TrashIcon } from "@/components/ui/icons"
import ConfirmModal from "@/components/ui/confirm-modal"

interface CustomerDetailScreenProps {
  customerId: string
  onBack: () => void
  onNavigateToIssue: () => void
  onNavigateToReturn: () => void
  onRefresh: () => void
  onNotifySuccess?: (message: string) => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function CustomerDetailScreen({ customerId, onBack, onNavigateToIssue, onNavigateToReturn, onRefresh, onNotifySuccess, onNotify, t, language }: CustomerDetailScreenProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const customer = useMemo(() => getCustomerById(customerId), [customerId, refreshTrigger])
  const transactions = useMemo(() => getCustomerTransactions(customerId), [customerId, refreshTrigger])

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!deleteId) return

    deleteTransaction(deleteId)
    setDeleteId(null)
    setPin("")
    setError("")
    onNotifySuccess?.(t("transactionDeleted"))
    setRefreshTrigger(prev => prev + 1)
    onRefresh()
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-muted-foreground">Customer profile not found</p>
        <button onClick={onBack} className="text-primary font-black uppercase tracking-widest text-xs">Return to Directory</button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <button
          onClick={onBack}
          className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-foreground" />
        </button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground truncate max-w-[200px]">{customer.name}</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("newCustomerProfile")}</p>
        </div>
      </header>

      <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* Profile Card - Premium */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] p-8 shadow-premium space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center font-black text-3xl shadow-lg">
              {customer.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <p className="font-black text-xl tracking-tight">{customer.name}</p>
              <p className="text-sm text-muted-foreground font-bold">{customer.phone}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{customer.address || "No address on file"}</p>
            </div>
          </div>

          {/* Trust Status Toggle */}
          <div className="bg-secondary/30 rounded-3xl p-6 border border-border/50 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">
                {customer.trustStatus === "approved" ? t("trustedCustomer") : t("standardCustomer")}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">
                {customer.trustStatus === "approved" ? t("noDepositRequired") : t("depositRequired")}
              </p>
            </div>
            <button
              onClick={() => {
                const newStatus = customer.trustStatus === "approved" ? "pending" : "approved"
                updateCustomerTrustStatus(customer.id, newStatus)
                onNotifySuccess?.(t("trustStatusUpdated"))
                onRefresh()
              }}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${customer.trustStatus === "approved"
                ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                }`}
            >
              {customer.trustStatus === "approved" ? t("revokeTrust") : t("markAsTrusted")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-3xl p-5 space-y-2 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BottleIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("outstanding")}</span>
              </div>
              <p className="text-2xl font-black tracking-tight">{customer.bottlesOutstanding}</p>
            </div>
            <div className="bg-secondary/50 rounded-3xl p-5 space-y-2 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MoneyIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("deposits")}</span>
              </div>
              <p className="text-2xl font-black tracking-tight">ETB {customer.depositsHeld.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onNavigateToReturn}
              className="py-5 bg-secondary/50 text-foreground border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-soft flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-secondary"
            >
              <ReceiveIcon className="w-4 h-4" />
              {t("return")}
            </button>
            <button
              onClick={onNavigateToIssue}
              className="py-5 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              <SendIcon className="w-4 h-4" />
              {t("issue")}
            </button>
          </div>
        </div>

        {/* History Section - Professional */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("fullHistory")}</h3>
            <div className="h-[1px] flex-1 bg-border mx-4 opacity-50" />
          </div>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.slice(0, 20).map((txn) => (
                <div key={txn.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-4 shadow-soft flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <ActivityItem transaction={txn} t={t} />
                  </div>
                  <button
                    onClick={() => setDeleteId(txn.id)}
                    className="p-2.5 bg-secondary/50 text-muted-foreground hover:bg-red-500 hover:text-white rounded-xl transition-all shrink-0"
                    title={t("deleteTransaction")}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-16 text-center bg-secondary/20 rounded-[2.5rem] border border-dashed border-border">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t("noActivity")}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Password Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{t("deleteTransaction")}</h3>
              <p className="text-xs text-muted-foreground">{t("enterPinToConfirm")}</p>
            </div>

            <div className="space-y-4">
              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteId(null)
                  setPin("")
                  setError("")
                }}
                className="flex-1 py-4 bg-secondary text-foreground rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
