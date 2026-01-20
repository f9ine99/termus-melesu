"use client"

import { useEffect, useState } from "react"
import { SmartphoneIcon } from "lucide-react"

export function MobileRecommendation() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="hidden md:flex fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="max-w-md space-y-8">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-full h-full bg-card border border-border rounded-[2rem] flex items-center justify-center shadow-2xl">
                        <SmartphoneIcon className="w-10 h-10 text-primary animate-bounce" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        Mobile Experience
                    </h1>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                        Retra is designed to be used on your mobile device for the best experience. Please switch to your phone to continue managing your bottle ledger.
                    </p>
                </div>

                <div className="pt-8">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">
                        Optimized for iOS & Android
                    </p>
                </div>
            </div>
        </div>
    )
}
