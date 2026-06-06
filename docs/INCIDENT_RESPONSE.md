# Incident Response Runbook — Retra

Internal checklist for personal-data security incidents. Not legal advice.

## Scope

Applies to breaches or suspected breaches affecting Retra user data: account credentials, customer records, transactions, exports, or processor integrations (Supabase, Vercel, Groq).

## Roles

| Role | Responsibility |
|------|----------------|
| **Owner / DPO contact** | Privacy decisions, regulator communication, user notification |
| **Engineering** | Containment, root cause, remediation |
| **Support** | User inquiries via privacy contact email |

Set `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` to the active privacy inbox.

## Severity levels

1. **Low** — Single user report, no evidence of wider exposure (e.g. mis-sent export file).
2. **Medium** — Confirmed unauthorized access to one account or misconfigured RLS/API.
3. **High** — Bulk data exposure, leaked service role key, or processor compromise.

## Response steps

### 1. Detect and triage (0–4 hours)

- [ ] Confirm the report or alert (logs, user report, Supabase/Vercel dashboard).
- [ ] Assign incident lead and severity.
- [ ] Document timeline: what happened, when, which systems, how many users.

### 2. Contain (immediate)

- [ ] Rotate compromised keys (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, etc.).
- [ ] Revoke suspicious sessions (Supabase Auth → users).
- [ ] Disable affected API routes or features if abuse is ongoing.
- [ ] Preserve evidence (logs, screenshots); do not delete audit trails prematurely.

### 3. Assess impact (4–24 hours)

- [ ] Identify data categories exposed (account email, customer PII, transactions).
- [ ] Count affected users and records.
- [ ] Determine if breach is likely to result in risk to individuals (GDPR Art. 33 test).

### 4. Notify (72 hours for supervisory authority if required)

- [ ] Consult legal counsel for EU/UK/EEA users.
- [ ] Notify supervisory authority within **72 hours** if required.
- [ ] Notify affected users without undue delay if high risk to their rights.

Use plain language: what happened, what data, what we did, what they should do.

### 5. Recover and remediate

- [ ] Deploy fix (RLS, auth, API hardening).
- [ ] Verify with test account and CI (`pnpm typecheck`, `pnpm lint`, `pnpm build`).
- [ ] Update `docs/DATA_PROCESSORS.md` or privacy policy if processing changed.

### 6. Post-incident review (within 14 days)

- [ ] Root cause analysis and preventive actions.
- [ ] Update this runbook if gaps were found.
- [ ] Record closure date and lessons learned.

## Useful links

- Supabase status: https://status.supabase.com
- Vercel status: https://www.vercel-status.com
- Privacy policy: `/privacy`
- Processor register: [DATA_PROCESSORS.md](./DATA_PROCESSORS.md)

## Contact template (user notification)

> We identified a security incident affecting Retra on [DATE]. [DESCRIPTION]. Data involved may have included [CATEGORIES]. We have [ACTIONS TAKEN]. We recommend [USER ACTIONS]. Contact [PRIVACY_EMAIL] with questions.
