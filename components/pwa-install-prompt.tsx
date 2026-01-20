"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if it's iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(isIosDevice)

        // Check if already installed
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone
        if (isStandalone) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowPrompt(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        // For iOS, show prompt after a delay if not installed
        if (isIosDevice && !isStandalone) {
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setDeferredPrompt(null)
            setShowPrompt(false)
        }
    }

    if (!showPrompt) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-background border rounded-lg shadow-lg p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 p-2 rounded-md h-fit">
                                <Download className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Install App</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Install Retra for a better experience with offline access.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-1"
                            onClick={() => setShowPrompt(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {isIOS ? (
                        <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                            Tap <span className="font-semibold">Share</span> then <span className="font-semibold">Add to Home Screen</span>
                        </div>
                    ) : (
                        <Button size="sm" className="w-full" onClick={handleInstallClick}>
                            Install
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
