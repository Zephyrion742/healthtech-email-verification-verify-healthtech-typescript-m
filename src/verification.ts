import { z } from "zod";
import { infrai } from "./infrai.js";

export const signupSchema = z.object({
  email: z.string().email(),
  patientName: z.string().min(1),
  appointmentId: z.string().min(1),
  verificationToken: z.string().min(12),
  emailVerified: z.boolean().default(false)
});
export type SignupRequest = z.infer<typeof signupSchema>;

export function verificationDecision(input: SignupRequest): "send" | "skip" {
  return input.emailVerified ? "skip" : "send";
}

export async function sendVerification(input: SignupRequest) {
  if (verificationDecision(input) === "skip") return { status: "already_verified" as const };
  const link = `https://clinic.example/verify?token=${encodeURIComponent(input.verificationToken)}`;
  const sent = await infrai.email.send({
    to: input.email,
    subject: "Verify your clinic account",
    html: `<p>Hello ${input.patientName},</p><p>Verify your email before appointment ${input.appointmentId}:</p><p><a href="${link}">Verify email</a></p>`
  }, `signup-verification:${input.appointmentId}:${input.email}`);
  const delivery = await infrai.email.get(sent.message_id);
  return { status: "sent" as const, message_id: sent.message_id, delivery };
}
