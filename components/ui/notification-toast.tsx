"use client"

import { AlertIcon, CheckIcon, InfoIcon, XIcon, UndoIcon } from "@/components/ui/icons"

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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[90vw] sm:max-w-md animate-in slide-in-from-top-4 fade-in duration-500 ease-out-spring">
            <div className={`
                relative overflow-hidden rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-3xl
                ${type === 'error'
                    ? 'bg-background/80 border-red-500/20'
                    : type === 'info'
                        ? 'bg-background/80 border-blue-500/20'
                        : 'bg-background/80 border-emerald-500/20'
                }
            `}>
                {/* Subtle Gradient Glow */}
                <div className={`absolute inset-0 opacity-[0.08] pointer-events-none ${type === 'error' ? 'bg-gradient-to-r from-red-500 to-transparent' :
                    type === 'info' ? 'bg-gradient-to-r from-blue-500 to-transparent' :
                        'bg-gradient-to-r from-emerald-500 to-transparent'
                    }`} />

                <div className="relative p-1.5 pr-2 flex items-center gap-3">
                    {/* Icon Container */}
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0
                        ${type === 'error'
                            ? 'bg-red-500 text-white shadow-red-500/20'
                            : type === 'info'
                                ? 'bg-blue-500 text-white shadow-blue-500/20'
                                : 'bg-emerald-500 text-white shadow-emerald-500/20'
                        }
                    `}>
                        {type === 'error' ? <AlertIcon className="w-5 h-5" /> :
                            type === 'info' ? <InfoIcon className="w-5 h-5" /> :
                                <CheckIcon className="w-5 h-5" />
                        }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-1.5">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${type === 'error' ? 'text-red-500' :
                            type === 'info' ? 'text-blue-500' :
                                'text-emerald-500'
                            }`}>
                            {title || (type === 'error' ? 'Error' : type === 'info' ? 'Notice' : 'Success')}
                        </p>
                        <p className="text-xs font-bold text-foreground/90 leading-tight">
                            {description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-2 border-l border-border/50">
                        {onUndo && (
                            <button
                                onClick={onUndo}
                                className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                                title="Undo"
                            >
                                <UndoIcon className="w-4 h-4" />
                                <span className="sr-only">Undo</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
