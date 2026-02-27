import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    db: "src/db.ts",
    "schema/index": "src/schema/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["drizzle-orm", "dotenv", "server-only"],
});
