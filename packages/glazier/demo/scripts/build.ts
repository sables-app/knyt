/// <reference types="bun-types" />

import { GlazierPlugin } from "@knyt/glazier";

console.info("Building...");

await Bun.build({
  entrypoints: ["./content/index.html"],
  outdir: "./dist",
  minify: true,
  plugins: [GlazierPlugin.withConfigFile()],
});

console.info("Build completed!");

export {};
