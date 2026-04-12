import { db, categories, eq, and, isNull, desc } from "@shopvendly/db";

export const categoryRepo = {
  async findAll() {
    return db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
    });
  },

  async findBySlug(slug: string) {
    return db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
  },

  async findByParentId(parentId: string) {
    return db.query.categories.findMany({
      where: eq(categories.parentId, parentId),
      orderBy: [desc(categories.createdAt)],
    });
  },

  async findById(id: string) {
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  },

  async create(data: typeof categories.$inferInsert) {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  },

  async update(id: string, data: Partial<typeof categories.$inferInsert>) {
    const [updated] = await db.update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  },

  async delete(id: string) {
    const [deleted] = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return deleted;
  },
};
