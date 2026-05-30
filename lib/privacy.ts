import { LEGAL_CONFIG } from "./config"

export const buildPrivacyRequestMailto = (accountEmail?: string): string => {
  const subject = encodeURIComponent("Retra Privacy Request")
  const body = encodeURIComponent(
    [
      "Hello Retra Support,",
      "",
      `Account email: ${accountEmail || "[your account email]"}`,
      "Request type: access | correction | deletion | portability",
      "",
      "Details:",
      "",
    ].join("\n"),
  )

  return `mailto:${LEGAL_CONFIG.PRIVACY_CONTACT_EMAIL}?subject=${subject}&body=${body}`
}
