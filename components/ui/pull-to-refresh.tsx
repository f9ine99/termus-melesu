"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void
    children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0)
    const [currentY, setCurrentY] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const THRESHOLD = 80
    const MAX_PULL = 120

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const scrollContainer = contentRef.current?.parentElement
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0

            if (scrollTop === 0 && !refreshing) {
                setStartY(e.touches[0].clientY)
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            const scrollContainer = contentRef.current?.parentElement
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0

            if (startY > 0 && !refreshing && scrollTop === 0) {
                const y = e.touches[0].clientY
                const diff = y - startY

                if (diff > 0) {
                    // Add resistance
                    const pull = Math.min(diff * 0.5, MAX_PULL)
                    setCurrentY(pull)

                    // Prevent default only if we're pulling down at the top
                    if (e.cancelable) {
                        e.preventDefault()
                    }
                }
            }
        }

        const handleTouchEnd = async () => {
            if (currentY > THRESHOLD && !refreshing) {
                setRefreshing(true)
                setCurrentY(THRESHOLD) // Snap to threshold

                try {
                    await onRefresh()
                } finally {
                    setTimeout(() => {
                        setRefreshing(false)
                        setCurrentY(0)
                        setStartY(0)
                    }, 500)
                }
            } else {
                setCurrentY(0)
                setStartY(0)
            }
        }

        const element = contentRef.current
        if (element) {
            element.addEventListener('touchstart', handleTouchStart, { passive: true })
            element.addEventListener('touchmove', handleTouchMove, { passive: false })
            element.addEventListener('touchend', handleTouchEnd)
        }

        return () => {
            if (element) {
                element.removeEventListener('touchstart', handleTouchStart)
                element.removeEventListener('touchmove', handleTouchMove)
                element.removeEventListener('touchend', handleTouchEnd)
            }
        }
    }, [startY, currentY, refreshing, onRefresh])

    return (
        <div ref={contentRef} className="min-h-full relative">
            {/* Refresh Indicator */}
            <div
                className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-50 transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${currentY > 0 ? currentY - 40 : -40}px)`,
                    opacity: currentY > 0 ? Math.min(currentY / THRESHOLD, 1) : 0
                }}
            >
                <div className="bg-background/80 backdrop-blur-md border border-border rounded-full p-2 shadow-lg mt-safe-top">
                    <Loader2 className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${currentY * 2}deg)` }} />
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${currentY}px)`,
                    transition: refreshing ? 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.2s cubic-bezier(0, 0, 0.2, 1)'
                }}
            >
                {children}
            </div>
        </div>
    )
}
