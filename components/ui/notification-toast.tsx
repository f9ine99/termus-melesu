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
    return (
        <div className="fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[100] animate-in slide-in-from-top-4 duration-500 ease-out">
            <div className={`backdrop-blur-xl border px-6 py-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 transition-all ${type === 'error' ? 'bg-red-500/90 border-red-500/20 text-white' :
                    type === 'info' ? 'bg-blue-500/90 border-blue-500/20 text-white' :
                        'bg-foreground/90 border-white/10 text-background'
                }`}>
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${type === 'error' ? 'bg-white/20' :
                            type === 'info' ? 'bg-white/20' :
                                'bg-background/20'
                        }`}>
                        {type === 'error' ? <AlertIcon className="w-5 h-5" /> :
                            type === 'info' ? <InfoIcon className="w-5 h-5" /> :
                                <CheckIcon className="w-5 h-5" />
                        }
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {type === 'error' ? 'Error' : type === 'info' ? 'Info' : 'Success'}
                        </p>
                        <p className="text-xs font-bold tracking-tight truncate pr-2">{message}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {onUndo && (
                        <button
                            onClick={onUndo}
                            className="px-4 py-2 bg-background text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all whitespace-nowrap"
                        >
                            Undo
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all active:scale-95 ${type === 'error' || type === 'info' ? 'hover:bg-white/10' : 'hover:bg-background/10'
                            }`}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
