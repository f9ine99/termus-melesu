"use client"

import { BottleIcon, SendIcon, ReceiveIcon } from "@/components/ui/icons"
import { formatDistanceToNow } from "date-fns"
import type { Transaction } from "@/lib/types"

interface ActivityItemProps {
    transaction: Transaction
    t: (key: any, params?: any) => string
}

export default function ActivityItem({ transaction, t }: ActivityItemProps) {
    const isIssue = transaction.type === "issue"

    return (
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIssue ? "bg-primary/10 text-primary" : "bg-green-100 text-green-600"}`}>
                {isIssue ? <SendIcon className="w-5 h-5" /> : <ReceiveIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-black truncate">{transaction.customerName || t("unknownCustomer")}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <div className="flex flex-col gap-1">
                    {transaction.items && transaction.items.length > 0 ? (
                        <div className="space-y-1">
                            {transaction.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-muted-foreground">
                                        {isIssue ? t("issue") : t("return")} {item.bottleCount} × {item.brand}
                                        <span className="ml-2 opacity-50 text-[10px] uppercase">({item.category})</span>
                                    </p>
                                    <p className={`text-xs font-black ${isIssue ? "text-primary" : "text-green-600"}`}>
                                        {isIssue ? "+" : "-"} ETB {item.depositAmount}
                                    </p>
                                </div>
                            ))}
                            <div className="pt-1 mt-1 border-t border-border/50 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("total")}</p>
                                <p className={`text-xs font-black ${isIssue ? "text-primary" : "text-green-600"}`}>
                                    {isIssue ? "+" : "-"} ETB {transaction.depositAmount}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-muted-foreground">
                                {isIssue ? t("issue") : t("return")} {transaction.bottleCount} × {transaction.brand || transaction.bottleType}
                                <span className="ml-2 opacity-50 text-[10px] uppercase">({transaction.category || t("other")})</span>
                            </p>
                            <p className={`text-xs font-black ${isIssue ? "text-primary" : "text-green-600"}`}>
                                {isIssue ? "+" : "-"} ETB {transaction.depositAmount}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
