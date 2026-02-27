import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "email.ts", "resend.ts", "emails/*.tsx"],
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  treeshake: true,
  external: ["react", "react-dom"],
});
