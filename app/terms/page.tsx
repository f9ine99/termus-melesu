"use client"

import Link from "next/link"
import { ArrowLeftIcon, ShieldCheckIcon, BottleIcon } from "@/components/ui/icons"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden selection:bg-primary/20">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse-subtle" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-4xl px-6 py-12 md:py-24 relative z-10">
                {/* Header */}
                <header className="mb-16 space-y-8 animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="group p-4 bg-card/50 backdrop-blur-xl border border-border rounded-2xl hover:bg-secondary transition-all active:scale-95 shadow-soft"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner-soft">
                            <BottleIcon className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                            <ShieldCheckIcon className="w-3 h-3" />
                            Legal Documentation
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
                            Terms of <span className="text-primary">Service</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                            Please read these terms carefully before using our application. By accessing or using Termus Melesu, you agree to be bound by these terms.
                        </p>
                        <div className="pt-2 flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <span>Version 1.0.0</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span>Updated Jan 27, 2026</span>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <main className="grid grid-cols-1 md:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    {/* Sidebar Navigation (Desktop) */}
                    <aside className="hidden md:block md:col-span-3 space-y-4 sticky top-24 h-fit">
                        <nav className="space-y-1">
                            {["Introduction", "User Accounts", "Data Usage", "Prohibited Activities", "Liability", "Changes"].map((item, i) => (
                                <a
                                    key={item}
                                    href={`#section-${i + 1}`}
                                    className="block px-4 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="md:col-span-9 space-y-16">
                        <section id="section-1" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">01</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Introduction</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    Welcome to Termus Melesu. Our service provides a professional digital ledger system designed to streamline bottle inventory management and customer transaction tracking for businesses.
                                </p>
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    By accessing or using any part of the service, you agree to become bound by the terms and conditions of this agreement. If you do not agree to all the terms and conditions, then you may not access the service.
                                </p>
                            </div>
                        </section>

                        <section id="section-2" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">02</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">User Accounts</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    To access certain features of the service, you may be required to create an account. You are responsible for:
                                </p>
                                <ul className="list-none space-y-3 pl-0">
                                    {[
                                        "Maintaining the security of your account and password.",
                                        "All activities that occur under your account.",
                                        "Providing accurate and complete information during registration.",
                                        "Notifying us immediately of any unauthorized use of your account."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-3" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">03</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Data Usage & Privacy</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    Your privacy is paramount. Termus Melesu is designed with a "local-first" philosophy. Most of your business data is stored directly on your device.
                                </p>
                                <div className="p-6 bg-secondary/30 rounded-[2rem] border border-border/50 space-y-3">
                                    <p className="text-xs font-bold text-foreground">Key Privacy Points:</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Cloud synchronization is optional and requires explicit configuration. We do not sell, rent, or trade your business data to third parties for marketing purposes.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="section-4" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">04</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Prohibited Activities</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    Users are strictly prohibited from:
                                </p>
                                <ul className="list-none space-y-3 pl-0">
                                    {[
                                        "Using the service for any fraudulent or illegal activities.",
                                        "Attempting to bypass any security measures of the application.",
                                        "Reverse engineering or attempting to extract the source code.",
                                        "Interfering with the proper working of the service."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/40" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-5" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">05</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Limitation of Liability</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium italic">
                                    "The service is provided on an 'as is' and 'as available' basis."
                                </p>
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    Termus Melesu and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangible losses.
                                </p>
                            </div>
                        </section>

                        <section id="section-6" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">06</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Changes to Terms</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    We reserve the right to modify or replace these terms at any time. If a revision is material, we will try to provide notice within the application.
                                </p>
                            </div>
                        </section>
                    </div>
                </main>

                <footer className="mt-32 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-1000">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                            <BottleIcon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Termus Melesu</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                        <span className="text-[10px] text-muted-foreground/30 font-bold">&copy; 2026</span>
                    </div>
                </footer>
            </div>

            <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 8s ease-in-out infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
        </div>
    )
}
