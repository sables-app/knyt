/// <reference types="bun-types" />

import { serve } from "@knyt/glazier";

import homepage from "./content/index.html";

Bun.serve({
  // Disable Bun's development mode to avoid issues with HMR.
  // We'll have to use `--watch` with manual reloads for now.
  // Related: https://github.com/oven-sh/bun/issues/19329
  // TODO: Remove this when Bun fixes the issue.
  development: false,
  port: 3000,
  routes: {
    "/": homepage,
    "/api/footer": serve(import("./content/footer.html")),
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});
