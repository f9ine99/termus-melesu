"use client"

import RecordTransactionForm from "@/components/ui/record-transaction-form"
import { ChartIcon, ArrowLeftIcon, SendIcon, ReceiveIcon } from "@/components/ui/icons"
import type { TransactionType } from "@/lib/types"

interface TransactionScreenProps {
  onNavigateToDashboard?: () => void
  onTransactionComplete?: () => void
  onNotifySuccess?: (message: string, transactionId?: string) => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info', transactionId?: string) => void
  initialCustomerId?: string
  type?: TransactionType
  t: (key: any, params?: any) => string
  language: string
}

export default function TransactionScreen({ onNavigateToDashboard, onTransactionComplete, onNotifySuccess, onNotify, initialCustomerId, type, t, language }: TransactionScreenProps) {
  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
            >
              <ArrowLeftIcon className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground truncate max-w-[200px]">
              {type === "issue" ? t("issueBottles") : type === "return" ? t("returnBottles") : t("recordTransaction")}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("recordTransaction")}</p>
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl">
          {type === "return" ? <ReceiveIcon className="w-5 h-5 text-primary" /> : <SendIcon className="w-5 h-5 text-primary" />}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 overflow-y-auto no-scrollbar pb-32 relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <RecordTransactionForm
            onNavigateBack={onNavigateToDashboard}
            onTransactionComplete={onTransactionComplete}
            onSuccess={onNotifySuccess}
            initialCustomerId={initialCustomerId}
            fixedType={type}
            t={t}
            language={language}
          />
        </div>
      </main>
    </div>
  )
}
