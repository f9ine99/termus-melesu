export const APP_CONFIG = {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://termus-melesu.vercel.app",
    getPasswordResetRedirectUrl: () => {
        const nextPath = encodeURIComponent("/auth/reset-password")
        return `${APP_CONFIG.SITE_URL}/auth/callback?next=${nextPath}`
    },
};

export const LEGAL_CONFIG = {
    POLICY_VERSION: "1.1.0",
    TERMS_OF_SERVICE_URL: process.env.NEXT_PUBLIC_TERMS_URL || `${APP_CONFIG.SITE_URL}/terms`,
    PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_URL || `${APP_CONFIG.SITE_URL}/privacy`,
    PRIVACY_CONTACT_EMAIL:
        process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL || "privacy@termus-melesu.vercel.app",
};
