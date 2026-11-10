import { signupSchema, sendVerification } from "./verification.js";

const input = signupSchema.parse({
  email: process.env.DEMO_EMAIL_TO,
  patientName: "Riley",
  appointmentId: "appt-204",
  verificationToken: "demo-token-2048",
  emailVerified: false
});
console.log(await sendVerification(input));
