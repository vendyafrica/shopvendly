import { db } from "@shopvendly/db/db";
import { and, eq } from "@shopvendly/db";
import { verification } from "@shopvendly/db/schema";

export const verificationRepo = {
  async findByEmailAndToken(email: string, token: string) {
    return db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, email),
        eq(verification.value, token)
      ),
    });
  },

  async deleteById(id: string) {
    await db.delete(verification).where(eq(verification.id, id));
  },
};
