/* eslint-disable no-undef */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: [
    (() => {
      const mod = require("@tailwindcss/postcss");
      const candidate = mod && (mod.default ?? mod);
      if (candidate && candidate.postcssPlugin) return candidate;
      if (typeof candidate === "function") return candidate({});
      return candidate;
    })(),
  ],
};