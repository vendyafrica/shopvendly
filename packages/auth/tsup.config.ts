import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/auth.ts"],
    format: ["esm", "cjs"],
    dts: true,
  },
  {
    entry: ["src/auth-client.ts"],
    format: ["esm", "cjs"],
    dts: true,
  },
]);
