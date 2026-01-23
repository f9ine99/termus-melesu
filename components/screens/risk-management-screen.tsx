"use client"

import { useState, useMemo } from "react"
import { getOverdueCustomers, addTransaction } from "@/lib/data-store"
import { ArrowLeftIcon, AlertIcon, WarningIcon, CheckIcon, XIcon, BottleIcon, MoneyIcon } from "@/components/ui/icons"
import type { Customer, Transaction } from "@/lib/types"

interface RiskManagementScreenProps {
    onBack: () => void
    onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
    t: (key: any, params?: any) => string
    language: string
}

export default function RiskManagementScreen({ onBack, onNotify, t, language }: RiskManagementScreenProps) {
    const [overdueDays, setOverdueDays] = useState(14)
    const overdueCustomers = useMemo(() => getOverdueCustomers(overdueDays), [overdueDays])
    const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(null)

    const handleSettle = (customer: Customer) => {
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            customerId: customer.id,
            customerName: customer.name,
            type: "settle",
            category: "Other",
            brand: "Settlement",
            bottleType: "Other",
            bottleCount: customer.bottlesOutstanding,
            depositAmount: customer.depositsHeld,
            timestamp: new Date().toISOString(),
            notes: `Account settled. ${customer.bottlesOutstanding} bottles lost, ${customer.depositsHeld} ETB deposit forfeited.`
        }

        addTransaction(transaction)
        onNotify?.(t("accountSettled") || "Account settled successfully", "success")
        setSettlingCustomer(null)
    }

    return (
        <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[40%] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] left-[-20%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="px-6 pt-10 pb-4 flex items-center gap-4 sticky top-0 bg-background/60 backdrop-blur-xl z-20">
                <button
                    onClick={onBack}
                    className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-foreground" />
                </button>
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">{t("riskManagement") || "Risk Management"}</h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("overdueTracking") || "Overdue Bottle Tracking"}</p>
                </div>
            </header>

            <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
                {/* Risk Threshold Selector - Premium Segmented Control */}
                <div className="glass-morphism rounded-[2.5rem] p-6 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("riskThreshold") || "Risk Threshold"}</p>
                            <p className="text-[9px] font-bold text-muted-foreground/60">{t("filterByInactivity") || "Filter by days of inactivity"}</p>
                        </div>
                        <div className="px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                            <span className="text-sm font-black text-primary">{overdueDays} {t("days") || "Days"}</span>
                        </div>
                    </div>

                    <div className="flex p-1.5 bg-secondary/30 backdrop-blur-md rounded-[1.8rem] border border-border/50 gap-1">
                        {[7, 14, 30, 60].map((days) => (
                            <button
                                key={days}
                                onClick={() => setOverdueDays(days)}
                                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-500 relative overflow-hidden ${overdueDays === days
                                    ? "text-primary-foreground shadow-premium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    }`}
                            >
                                {overdueDays === days && (
                                    <div className="absolute inset-0 bg-primary animate-in fade-in zoom-in-95 duration-300" />
                                )}
                                <span className="relative z-10">{days}d</span>
                            </button>
                        ))}
                    </div>

                    {/* Risk Level Indicator */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden flex">
                            <div
                                className={`h-full transition-all duration-700 ${overdueDays <= 14 ? 'bg-green-500' : overdueDays <= 30 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${(overdueDays / 60) * 100}%` }}
                            />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${overdueDays <= 14 ? 'text-green-500' : overdueDays <= 30 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {overdueDays <= 14 ? (t("lowRisk") || "Low Risk") : overdueDays <= 30 ? (t("mediumRisk") || "Medium Risk") : (t("highRisk") || "High Risk")}
                        </span>
                    </div>
                </div>

                {/* Overdue List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <AlertIcon className="w-4 h-4 text-amber-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("overdueAccounts") || "Overdue Accounts"}</h3>
                        </div>
                        <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full uppercase tracking-widest">{overdueCustomers.length} {t("atRisk") || "At Risk"}</span>
                    </div>

                    <div className="space-y-4">
                        {overdueCustomers.length > 0 ? (
                            overdueCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="glass-morphism rounded-[2rem] p-5 shadow-soft border border-border/50 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-foreground text-lg">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-black text-sm tracking-tight text-foreground">{customer.name}</p>
                                                <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{customer.daysInactive} {t("daysOverdue") || "Days Overdue"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-foreground tracking-tighter">{customer.bottlesOutstanding} <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1">{t("units") || "Units"}</span></p>
                                            <p className="text-[9px] font-bold text-muted-foreground">ETB {customer.depositsHeld.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/30 flex gap-3">
                                        <button
                                            onClick={() => setSettlingCustomer(customer)}
                                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                        >
                                            {t("settleAccount") || "Settle Account"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-6 glass-morphism rounded-[3rem] border-dashed">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckIcon className="w-10 h-10 text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-foreground tracking-tight">{t("allClear") || "All Clear"}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("noOverdueBottles") || "No overdue bottles found for this threshold."}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Settlement Confirmation Modal */}
            {settlingCustomer && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="space-y-2 text-center">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <WarningIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-foreground">{t("confirmSettlement") || "Confirm Settlement"}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t("settlementWarning") || `This will zero out ${settlingCustomer.name}'s outstanding bottles and forfeit their deposit of ETB ${settlingCustomer.depositsHeld.toLocaleString()}. This action cannot be undone.`}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSettlingCustomer(null)}
                                className="flex-1 py-4 bg-secondary text-foreground rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                            <button
                                onClick={() => handleSettle(settlingCustomer)}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                {t("confirm") || "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
