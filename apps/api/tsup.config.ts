import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["server.ts"],
  clean: true,
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
  external: ["better-auth/node"],
  ...options,
}));
