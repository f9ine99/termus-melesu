import Link from "next/link"
import { ArrowLeftIcon } from "@/components/ui/icons"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-3xl mx-auto">
            <header className="mb-12 flex items-center gap-4">
                <Link
                    href="/"
                    className="p-3 bg-secondary/50 border border-border rounded-2xl hover:bg-secondary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Last Updated: January 27, 2026</p>
                </div>
            </header>

            <main className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold">1. Information We Collect</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We collect information you provide directly to us, such as customer names, phone numbers, and transaction records.
                        We also collect technical data like device information and usage logs to improve our service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">2. How We Use Information</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We use the collected information to:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                        <li>Provide and maintain the digital ledger service.</li>
                        <li>Process and track bottle inventory and transactions.</li>
                        <li>Sync data across your devices (if cloud sync is enabled).</li>
                        <li>Improve and personalize your experience.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">3. Data Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We implement industry-standard security measures to protect your data. Local data is encrypted where possible,
                        and cloud transmissions are secured via HTTPS.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">4. Third-Party Services</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may use third-party services like Supabase for cloud storage and sync. These services have their own
                        privacy policies regarding how they handle your data.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">5. Your Rights</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You have the right to access, correct, or delete your data at any time. Since most data is stored locally,
                        you can manage it directly through the application settings.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">6. Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us at support@termus-melesu.vercel.app.
                    </p>
                </section>
            </main>

            <footer className="mt-20 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                &copy; 2026 Termus Melesu. All rights reserved.
            </footer>
        </div>
    )
}
