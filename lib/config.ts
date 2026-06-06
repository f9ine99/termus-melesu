export const APP_CONFIG = {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://termus-melesu.vercel.app",
    getPasswordResetRedirectUrl: () => {
        const nextPath = encodeURIComponent("/auth/reset-password")
        return `${APP_CONFIG.SITE_URL}/auth/callback?next=${nextPath}`
    },
};

export const RETENTION_CONFIG = {
    ACCOUNT_AND_LEDGER: "While your account is active. Deleted within 30 days of a confirmed account deletion request.",
    LOCAL_DEVICE: "Stored on your device until you clear browser data, uninstall the app, or delete your account.",
    CLOUD_SYNC: "When enabled, mirrored in Supabase until account deletion removes cloud copies.",
    ANALYTICS: "Usage analytics retained per Vercel Analytics processor defaults.",
    AI_PROCESSING:
        "AI summaries use pseudonymized aggregates only. Prompts are not stored by Retra; Groq processes requests per their retention policy.",
}

export const LEGAL_CONFIG = {
    POLICY_VERSION: "1.2.0",
    TERMS_OF_SERVICE_URL: process.env.NEXT_PUBLIC_TERMS_URL || `${APP_CONFIG.SITE_URL}/terms`,
    PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_URL || `${APP_CONFIG.SITE_URL}/privacy`,
    PRIVACY_CONTACT_EMAIL:
        process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL || "privacy@termus-melesu.vercel.app",
};
