export const APP_CONFIG = {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://termus-melesu.vercel.app",
};

export const LEGAL_CONFIG = {
    TERMS_OF_SERVICE_URL: process.env.NEXT_PUBLIC_TERMS_URL || `${APP_CONFIG.SITE_URL}/terms`,
    PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_URL || `${APP_CONFIG.SITE_URL}/privacy`,
};
