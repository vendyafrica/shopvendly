import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/auth.ts"],
    format: ["esm"],
    dts: true,
  },
  {
    entry: ["src/auth-client.ts"],
    format: ["esm"],
    dts: true,
  },
]);
