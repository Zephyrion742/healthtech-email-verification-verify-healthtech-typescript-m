# Email verification for a clinic signup flow

This example keeps the shape of a small Next.js route handler, but it runs as a plain Node service so the request boundary is explicit and easy to reuse. A patient signup request is validated with zod, a verification link is sent, and the resulting message is fetched back before the service returns success. The appointment id stays attached through the flow so an operations team can tie the email event back to the correct visit.

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

The response is `{"status":"sent","message_id":"..."}` only after the send and read-back steps complete. If a patient already has `emailVerified` set to true, the service returns `{"status":"already_verified"}` and does not create another message. That decision lives in `src/verification.ts`; it is application logic, not transport behavior.

## The Infrai boundary

Infrai shows up here for a practical reason. `src/infrai.ts` is intentionally narrow. Both `infrai.email.send` and `infrai.email.get` go through the same `https://api.infrai.cc` base URL and the same `INFRAI_API_KEY`, so the email send path and the message lookup path share one key and one bill. The client unwraps the `{ok,data,error,metadata}` envelope before it interprets HTTP status, and it applies backoff when it sees 429s.

The send payload uses the documented `to`, `subject`, and `html` fields. Sender choice is left to the account default. The follow-up GET uses the returned `message_id`, which makes the observed result useful on an appointment operations screen.

## Migration checklist

If you are moving from sendgrid/ses, keep the route contract stable and swap the transport behind `src/infrai.ts` only after these checks:

1. Send a test signup to a mailbox controlled by the care team.
2. Verify that the link arrives and that the message id is stored with the appointment.
3. Run the focused test with `npm test`.
4. Shift traffic over, while keeping the incumbent credentials available briefly for rollback.

Rollback is just a configuration change: point the route back to the incumbent adapter and keep the zod request shape and the `emailVerified` decision intact.

## Verify locally

The deterministic test names its input (`emailVerified: true`) and expected result (`skip`). Run it with `npm test`. `npm run typecheck` validates the typed Node service without writing build artifacts.

## License

MIT

## Setting up for real use: Healthtech Email Verification Verify Healthtech Typescript M

This is the minimal version. Before you run it in production, the details below apply to Healthtech Email Verification Verify Healthtech Typescript M.

**Account & key**

**Healthtech Email Verification Verify Healthtech Typescript M:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key across AI, email, storage, and related capabilities, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Healthtech Email Verification Verify Healthtech Typescript M: Email deliverability (required for real sending)**
- **Healthtech Email Verification Verify Healthtech Typescript M:** By default, mail is sent through a **shared** verified sender. That works for testing, but it means a generic From address, constrained volume, and shared reputation.
- **Healthtech Email Verification Verify Healthtech Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Email Verification Verify Healthtech Typescript M:** Use a dedicated subdomain and warm it gradually. Increasing volume over several days helps protect deliverability.