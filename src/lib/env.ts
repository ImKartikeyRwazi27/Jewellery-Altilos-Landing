import "server-only"

function requireEnv(name: string): string {
    const val = process.env[name]
    if(!val){
        throw new Error(`Missing required environment variable: ${name}`)
    }
    return val
}

function optionalEnv(name: string): string | undefined {
    const val = process.env[name]
    return val && val.trim() ? val : undefined
}

export const env = {
    get STRIPE_SECRET_KEY() {
        return requireEnv("STRIPE_SECRET_KEY")
    },
    get STRIPE_PRODUCT_ID_PULSE() {
        return requireEnv("STRIPE_PRODUCT_ID_PULSE")
    },
    get STRIPE_PRODUCT_ID_CORE() {
        return requireEnv("STRIPE_PRODUCT_ID_CORE")
    },
    get STRIPE_PRODUCT_ID_CORE_PLUS() {
        return requireEnv("STRIPE_PRODUCT_ID_CORE_PLUS")
    },
    get STRIPE_PRODUCT_ID_EXPERT() {
        return requireEnv("STRIPE_PRODUCT_ID_EXPERT")
    },
    // JSON object of `<add-on slug>: "price_..."`, e.g.
    //   {"pulse.responses_50":"price_123","pulse.city_2":"price_456"}
    // Optional on purpose: unset means no add-ons are offered, which is both the
    // pre-launch state and the one-step rollback. Parsed and validated by
    // parseAddOnPriceMap, which never throws.
    get STRIPE_ADDON_PRICE_IDS() {
        return optionalEnv("STRIPE_ADDON_PRICE_IDS")
    },
    // Stripe File ids (purpose `business_logo` / `business_icon`) used to
    // override the Dashboard's default branding per session. The Stripe account
    // is Rwazi's, so without these the checkout page shows the Rwazi mark.
    // Optional: unset simply falls back to the Dashboard's branding.
    get STRIPE_BRAND_LOGO_FILE() {
        return optionalEnv("STRIPE_BRAND_LOGO_FILE")
    },
    get STRIPE_BRAND_ICON_FILE() {
        return optionalEnv("STRIPE_BRAND_ICON_FILE")
    },
    get DATABASE_URL() {
        return requireEnv("DATABASE_URL")
    },
    // Deliberately strict, unlike SITE_URL in src/lib/site.ts. This accessor
    // feeds customer-facing onboarding links (onboarding-confirmation.ts,
    // order-finalization.ts) where a wrong origin is unrecoverable, and
    // onboarding-confirmation.ts matches this thrown message to render its
    // `configuration_missing` state. The metadata routes need the opposite
    // policy — they are evaluated at build time and must never throw — so
    // site.ts owns the fallback literal. Neither file duplicates the other.
    get NEXT_PUBLIC_BASE_URL() {
        return requireEnv("NEXT_PUBLIC_BASE_URL")
    },
    get STRIPE_WEBHOOK_SECRET() {
        return requireEnv("STRIPE_WEBHOOK_SECRET")
    },
    get ONBOARDING_TOKEN_PEPPER() {
        return requireEnv("ONBOARDING_TOKEN_PEPPER")
    },
    get MAILCHIMP_TRANSACTIONAL_API_KEY() {
        return requireEnv("MAILCHIMP_TRANSACTIONAL_API_KEY")
    },
    get MAILCHIMP_TRANSACTIONAL_FROM_EMAIL() {
        return requireEnv("MAILCHIMP_TRANSACTIONAL_FROM_EMAIL")
    },
    get MAILCHIMP_TRANSACTIONAL_FROM_NAME() {
        return requireEnv("MAILCHIMP_TRANSACTIONAL_FROM_NAME")
    },
    get PIPEDRIVE_API_BASE_URL() {
        return optionalEnv("PIPEDRIVE_API_BASE_URL") ?? "https://api.pipedrive.com/api/v2"
    },
    get PIPEDRIVE_API_TOKEN() {
        return optionalEnv("PIPEDRIVE_API_TOKEN")
    },
    get PIPEDRIVE_ONBOARDING_CONTEXT_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_ONBOARDING_CONTEXT_FIELD_KEY")
    },
    get PIPEDRIVE_DEFAULT_OWNER_ID() {
        const val = optionalEnv("PIPEDRIVE_DEFAULT_OWNER_ID")
        return val ? Number(val) : undefined
    },
    get PIPEDRIVE_LEAD_MAGNET_LABEL_ID() {
        const val = optionalEnv("PIPEDRIVE_LEAD_MAGNET_LABEL_ID")
        return val ? Number(val) : undefined
    },
    get PIPEDRIVE_LEAD_COMPANY_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_LEAD_COMPANY_FIELD_KEY")
    },
    get PIPEDRIVE_LEAD_SOURCE_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_LEAD_SOURCE_FIELD_KEY")
    },
    get PIPEDRIVE_SECONDARY_LEAD_SOURCE_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_SECONDARY_LEAD_SOURCE_FIELD_KEY")
    },
    get PIPEDRIVE_LEAD_STATUS_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_LEAD_STATUS_FIELD_KEY")
    },
    get PIPEDRIVE_JOB_TITLE_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_JOB_TITLE_FIELD_KEY")
    },
    get PIPEDRIVE_WEBSITE_FIELD_KEY() {
        return optionalEnv("PIPEDRIVE_WEBSITE_FIELD_KEY")
    },
    get MAILCHIMP_TEAM_NOTIFICATION_EMAILS() {
        return optionalEnv("MAILCHIMP_TEAM_NOTIFICATION_EMAILS")
    },
    get RESEND_TEAM_NOTIFICATION_EMAILS() {
        return optionalEnv("RESEND_TEAM_NOTIFICATION_EMAILS")
    },
    get RESEND_API_KEY() {
        return requireEnv("RESEND_API_KEY")
    },
    get RESEND_FROM_EMAIL() {
        return requireEnv("RESEND_FROM_EMAIL")
    },
    get RESEND_FROM_NAME() {
        return requireEnv("RESEND_FROM_NAME")
    },
    // Where customer replies land. Resend sends from a no-inbox address, so
    // without this a reply to any Altilos email goes nowhere.
    get RESEND_REPLY_TO_EMAIL() {
        return optionalEnv("RESEND_REPLY_TO_EMAIL") ?? "kartikey.sangal@rwazi.com"
    },
    get LEAD_MAGNET_FILE_PATH() {
        return optionalEnv("LEAD_MAGNET_FILE_PATH") ?? "public/lead-magnet.pdf"
    },
    get LEAD_MAGNET_FILE_NAME() {
        return optionalEnv("LEAD_MAGNET_FILE_NAME") ?? "Altilos-India-Jewellery-CLS-FY26.pdf"
    },
    get LEAD_MAGNET_FILE_TYPE() {
        return optionalEnv("LEAD_MAGNET_FILE_TYPE") ?? "application/pdf"
    },
}
