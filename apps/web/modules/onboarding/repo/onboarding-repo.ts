import crypto from "crypto";
import { db } from "@shopvendly/db/db";
import { verification } from "@shopvendly/db/schema";

export const onboardingRepo = {
  async createVerificationToken(identifier: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verification).values({
      id: crypto.randomBytes(16).toString("hex"),
      identifier,
      value: token,
      expiresAt,
    });

    return { token, expiresAt };
  },
};
