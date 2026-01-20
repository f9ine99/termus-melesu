"use client"

import { TrashIcon, XIcon } from "./icons"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
    variant?: "destructive" | "primary"
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = "destructive"
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] animate-in fade-in duration-500 p-6">
            <div className="w-full max-w-md bg-card/95 backdrop-blur-3xl rounded-[3.5rem] p-10 space-y-10 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-12 duration-700 ease-out">
                <div className="text-center space-y-4">
                    <div className={`w-24 h-24 ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-[2.5rem] flex items-center justify-center mx-auto mb-4`}>
                        {variant === 'destructive' ? <TrashIcon className="w-12 h-12" /> : <div className="w-12 h-12 rounded-full bg-current opacity-20" />}
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight text-foreground">{title}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-60 leading-relaxed">{description}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-6 bg-secondary/50 text-foreground rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-secondary border border-border/50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className={`flex-2 py-6 ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'} rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all hover:brightness-110`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
