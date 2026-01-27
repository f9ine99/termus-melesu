import Link from "next/link"
import { ArrowLeftIcon } from "@/components/ui/icons"

export default function TermsPage() {
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
                    <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Last Updated: January 27, 2026</p>
                </div>
            </header>

            <main className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold">1. Introduction</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Welcome to Termus Melesu. By using our application, you agree to these terms. Please read them carefully.
                        Our service provides a digital ledger for managing bottle inventory and customer transactions.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">2. User Accounts</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials.
                        Any activity under your account is your responsibility. We reserve the right to terminate accounts that violate our policies.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">3. Data Usage & Privacy</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Your data is stored locally on your device and can be synced to our cloud service if configured.
                        We do not sell your personal data to third parties. Please refer to our Privacy Policy for more details.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">4. Prohibited Activities</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You may not use the service for any illegal purposes, including fraud or unauthorized data access.
                        Tampering with the application's security or reverse engineering the software is strictly prohibited.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">5. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Termus Melesu is provided "as is" without warranties of any kind. We are not liable for any data loss
                        or business interruption resulting from the use of our service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">6. Changes to Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
                    </p>
                </section>
            </main>

            <footer className="mt-20 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                &copy; 2026 Termus Melesu. All rights reserved.
            </footer>
        </div>
    )
}
