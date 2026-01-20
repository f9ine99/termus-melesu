"use client"

import { AlertIcon, CheckIcon, InfoIcon, XIcon } from "@/components/ui/icons"

export type NotificationType = 'success' | 'error' | 'info'

interface NotificationToastProps {
    message: string
    type: NotificationType
    onClose: () => void
    onUndo?: () => void
}

export function NotificationToast({ message, type, onClose, onUndo }: NotificationToastProps) {
    // Parse message for title:description format (e.g., "Error Title: Description here")
    const colonIndex = message.indexOf(':')
    const hasTitle = colonIndex > 0 && colonIndex < 30 // Only treat as title if colon is early in string
    const title = hasTitle ? message.substring(0, colonIndex).trim() : null
    const description = hasTitle ? message.substring(colonIndex + 1).trim() : message

    return (
        <div className="fixed top-4 left-3 right-3 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg z-[100] animate-in slide-in-from-top-4 fade-in duration-400 ease-out">
            <div className={`
                backdrop-blur-2xl border shadow-2xl rounded-3xl overflow-hidden
                ${type === 'error'
                    ? 'bg-gradient-to-br from-red-500/95 via-red-500/90 to-red-600/95 border-red-400/30 text-white'
                    : type === 'info'
                        ? 'bg-gradient-to-br from-blue-500/95 via-blue-500/90 to-blue-600/95 border-blue-400/30 text-white'
                        : 'bg-gradient-to-br from-emerald-500/95 via-emerald-500/90 to-emerald-600/95 border-emerald-400/30 text-white'
                }
            `}>
                {/* Main Content */}
                <div className="px-4 py-4 sm:px-5 sm:py-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon */}
                        <div className={`
                            w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex-shrink-0 flex items-center justify-center
                            bg-white/20 backdrop-blur-sm shadow-inner
                        `}>
                            {type === 'error' ? <AlertIcon className="w-5 h-5 sm:w-6 sm:h-6" /> :
                                type === 'info' ? <InfoIcon className="w-5 h-5 sm:w-6 sm:h-6" /> :
                                    <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            }
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                            {/* Type Badge or Title */}
                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] opacity-80 mb-1">
                                {title || (type === 'error' ? 'Error' : type === 'info' ? 'Notice' : 'Success')}
                            </p>
                            {/* Message - Now wraps properly */}
                            <p className="text-[13px] sm:text-sm font-semibold leading-relaxed opacity-95">
                                {description}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 -mr-1 -mt-1 rounded-xl hover:bg-white/15 active:bg-white/25 active:scale-90 transition-all flex-shrink-0"
                            aria-label="Close notification"
                        >
                            <XIcon className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
                        </button>
                    </div>
                </div>

                {/* Undo Action Bar - Only shows when undo is available */}
                {onUndo && (
                    <div className="px-4 pb-3 sm:px-5 sm:pb-4 -mt-1">
                        <button
                            onClick={onUndo}
                            className="w-full py-2.5 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                        >
                            Tap to Undo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
