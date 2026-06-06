# Data Processor Register — Retra

Record of third parties that process personal data on behalf of Retra. Review quarterly and when adding integrations.

| Processor | Purpose | Data categories | Location / transfer | DPA / terms |
|-----------|---------|-----------------|---------------------|-------------|
| **Supabase** | Authentication, PostgreSQL storage, optional cloud sync | Account email, user metadata, customer names/phones/addresses, transactions | US/EU (project region) | [Supabase DPA](https://supabase.com/legal/dpa) · [Privacy](https://supabase.com/privacy) |
| **Vercel** | Hosting, Analytics | IP, device/browser signals, page views | US / global edge | [Vercel DPA](https://vercel.com/legal/dpa) · [Privacy](https://vercel.com/legal/privacy-policy) |
| **Groq** | AI summaries (opt-in only) | Pseudonymized aggregates (no customer names sent by app) | US | [Groq policies](https://groq.com/policies) — verify current DPA/subprocessor terms |

## Legal basis (summary)

- **Contract** — Service delivery (ledger, sync, auth).
- **Consent** — Signup policy acceptance; optional AI Insights toggle.
- **Legitimate interest** — Security, fraud prevention, minimal analytics (document in privacy policy).

## Operator responsibilities

- [ ] Supabase RLS enabled on `customers` and `transactions` (`user_id = auth.uid()`).
- [ ] Service role key only on server (`SUPABASE_SERVICE_ROLE_KEY`), never in client.
- [ ] `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` configured for production.
- [ ] AI Insights disabled by default; minimization in `lib/ai-minimization.ts`.

## Change log

| Date | Change |
|------|--------|
| 2026-05-30 | Initial register (GDPR Phase 4) |
