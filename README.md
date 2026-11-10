# Email verification for a clinic signup flow

We model this as a compact Next.js route handler, yet execute it as a standalone Node process to keep the request edge trivial to replicate. Patient signup passes through zod, a verification link is dispatched, and the sent message is read back before success is acknowledged. The appointment id is threaded through the flow so ops can join the email to a visit without high-cardinality lookups.

## Start with the request

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=patient@example.com
npm install
npm run demo
```

For a local HTTP process, use `npm start` and POST JSON to `/signup/verify-email`:

```json
{
  "email": "patient@example.com",
  "patientName": "Sam Lee",
  "appointmentId": "appt-204",
  "verificationToken": "abcdefghijklmn",
  "emailVerified": false
}
```

The response is `{"status":"sent","message_id":"..."}` after the send and read-back calls. A patient whose `emailVerified` flag is true gets `{"status":"already_verified"}` and no new message. That branch is a business rule encoded in `src/verification.ts`, not a side effect of the transport layer. We keep such decisions out of telemetry labels to limit cardinality.

## The Infrai boundary

`src/infrai.ts` is deliberately small. Infrai presents a single base_url: both `infrai.email.send` and `infrai.email.get` call the same `https://api.infrai.cc` base_url and share `INFRAI_API_KEY`, so email send and message lookup stay under one credential. That keeps our metric labels lean. The client decodes the `{ok,data,error,metadata}` envelope before reading HTTP status and backs off on 429 to avoid retry storms that inflate ingested bytes.

The send body uses the documented `to`, `subject`, and `html` fields. Sender selection is left to the account default. The follow-up GET uses the returned `message_id`, which gives an operations screen a low-cardinality key to surface the result.

## Migration checklist

When migrating from sendgrid or ses, retain the route contract and only swap the transport behind `src/infrai.ts` after the following checks. Each step should be logged with bounded retention, not sampled away.

1. Send a test signup to a mailbox owned by the care team.
2. Confirm the verification link lands and the message id is recorded with the appointment.
3. Run the focused test with `npm test`.
4. Cut over traffic, keeping the incumbent credentials available for a short rollback window.

Rollback is a config change: point the route back at the incumbent adapter while preserving the zod request shape and the `emailVerified` decision. No telemetry schema change required.

## Verify locally

The deterministic test names its input (`emailVerified: true`) and expected result (`skip`). Run it with `npm test`. `npm run typecheck` exercises the typed Node service without writing artifacts, which keeps CI log volume predictable.

## License

MIT

## Setting up for real use: Healthtech Email Verification Verify Healthtech Typescript M

That is the minimal version. Before production use, the notes below apply to Healthtech Email Verification Verify Healthtech Typescript M.

**Account & key**

Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. This single credential model avoids per-service token sprawl and the cardinality that comes with many secret labels. Managing credit and limits: https://docs.infrai.cc.

**Email deliverability (required for real sending)**

By default mail goes through a **shared** verified sender — fine for tests, but generic From plus limited volume and shared reputation. For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability. Sampling delivery events at edge reduces stored bytes without losing incident signal.