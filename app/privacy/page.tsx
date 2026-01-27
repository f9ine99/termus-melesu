"use client"

import Link from "next/link"
import { ArrowLeftIcon, LockIcon, BottleIcon } from "@/components/ui/icons"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden selection:bg-primary/20">
            {/* Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse-subtle" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

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
                            <LockIcon className="w-3 h-3" />
                            Privacy & Security
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
                            Privacy <span className="text-primary">Policy</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                            Your privacy is our priority. This policy explains how we collect, use, and protect your business data within Termus Melesu.
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
                            {["Data Collection", "Usage", "Security", "Third-Parties", "Your Rights", "Contact"].map((item, i) => (
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
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Information We Collect</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    We collect information that you voluntarily provide when using the application. This includes:
                                </p>
                                <ul className="list-none space-y-3 pl-0">
                                    {[
                                        "Business profile information (Name, Email).",
                                        "Customer details (Names, Phone numbers, Addresses).",
                                        "Transaction records (Bottle inventory, Deposits, Refunds).",
                                        "Technical logs for performance monitoring and error tracking."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-2" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">02</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">How We Use Information</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    The information we collect is used solely to provide and improve our services:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { title: "Service Delivery", desc: "Managing your digital ledger and inventory." },
                                        { title: "Cloud Sync", desc: "Synchronizing data across your authorized devices." },
                                        { title: "Analytics", desc: "Generating business insights and reports." },
                                        { title: "Support", desc: "Responding to your inquiries and technical issues." }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{item.title}</p>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="section-3" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">03</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Data Security</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    We employ rigorous security measures to ensure your data remains safe:
                                </p>
                                <div className="p-6 bg-card/50 backdrop-blur-sm rounded-[2rem] border border-border shadow-soft flex items-center gap-6">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <LockIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                        All data transmissions are encrypted via industry-standard SSL/TLS protocols. Local storage on your device is protected by application-level security and OS-level encryption.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="section-4" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">04</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Third-Party Services</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    We may utilize trusted third-party services to facilitate our operations:
                                </p>
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    For example, we use <span className="text-foreground font-bold">Supabase</span> for secure cloud storage and synchronization. These partners are prohibited from using your information for any purpose other than providing services to us.
                                </p>
                            </div>
                        </section>

                        <section id="section-5" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">05</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Your Rights</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    You maintain full control over your data. You have the right to:
                                </p>
                                <ul className="list-none space-y-3 pl-0">
                                    {[
                                        "Access all your stored data at any time.",
                                        "Export your data in standard JSON format.",
                                        "Delete your account and all associated data.",
                                        "Opt-out of optional cloud synchronization."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-6" className="space-y-6 group">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black text-primary shadow-sm">06</span>
                                <h2 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">Contact Us</h2>
                            </div>
                            <div className="pl-12 space-y-4">
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    If you have any questions or concerns regarding our privacy practices, please reach out to our legal team:
                                </p>
                                <a
                                    href="mailto:support@termus-melesu.vercel.app"
                                    className="inline-block px-6 py-3 bg-secondary text-foreground rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                                >
                                    support@termus-melesu.vercel.app
                                </a>
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
                        <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
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
