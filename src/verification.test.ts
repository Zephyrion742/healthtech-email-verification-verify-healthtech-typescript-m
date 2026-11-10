import test from "node:test";
import assert from "node:assert/strict";
import { signupSchema, verificationDecision } from "./verification.js";

test("verified patients do not receive another link", () => {
  const input = signupSchema.parse({ email: "patient@example.com", patientName: "Sam", appointmentId: "appt-1", verificationToken: "abcdefghijklmn", emailVerified: true });
  assert.equal(verificationDecision(input), "skip");
});
