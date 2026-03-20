import { db } from "@shopvendly/db/db";
import { eq } from "@shopvendly/db";
import { superAdmins, users } from "@shopvendly/db/schema";

export const superAdminRepo = {
  async findByUserId(userId: string) {
    return db.query.superAdmins.findFirst({
      where: eq(superAdmins.userId, userId),
      columns: { id: true },
    });
  },

  async listNotificationRecipients() {
    return db
      .select({
        email: users.email,
      })
      .from(superAdmins)
      .innerJoin(users, eq(superAdmins.userId, users.id));
  },
};
