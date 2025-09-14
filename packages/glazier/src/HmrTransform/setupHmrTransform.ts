import type { JavaScriptLoader, PluginBuilder } from "bun";
import { parseSync } from "oxc-parser";

import { interpretModule } from "./interpretModule";

/**
 * Loaders that we want to specially handle.
 */
const javascriptLoaders = [
  "js",
  "jsx",
  "ts",
  "tsx",
] as const satisfies readonly JavaScriptLoader[];

function isJavaScriptLoader(loader: Bun.Loader): loader is JavaScriptLoader {
  return javascriptLoaders.includes(loader as JavaScriptLoader);
}

/**
 * Code to inject for HMR support.
 *
 * @see https://bun.sh/docs/bundler/hmr
 *
 * @remarks
 *
 * We don't need to check for `import.meta.hot` before calling
 * `import.meta.hot.accept()`, because Bun will remove the call
 * if HMR is not enabled.
 */
const HMR_ACCEPT_CODE = "\nimport.meta.hot.accept();\n";

/**
 * Sets up a transform that injects HMR support code into files that import
 * Knyt packages and define custom elements.
 *
 * @param builder - The plugin builder to set up the transform on.
 */
export function setupHmrTransform(builder: PluginBuilder): void {
  builder.onLoad(
    { filter: /\.(js|jsx|mjs|cjs|ts|tsx)$/ },
    async ({ path: inputPath, defer, loader }) => {
      if (!isJavaScriptLoader(loader)) return;

      try {
        const fileText = Bun.file(inputPath).text();
        const [script] = await Promise.all([fileText, defer()]);

        // Instead of scanning for imports first, with (Bun.Transpiler.scanImports),
        // we just parse directly. In my tests, parsing the entire file with oxc
        // was often faster than scanning for imports, especially for larger files.
        const parseResult = parseSync(inputPath, script, {
          lang: loader,
          sourceType: "module",
          astType: "ts",
        });

        const interpreted = interpretModule(parseResult);
        const shouldInjectHmr =
          interpreted.hasKnytImports && interpreted.hasDefinedElements;

        if (!shouldInjectHmr) return;

        return {
          contents: `${script}${HMR_ACCEPT_CODE}`,
          loader,
        };
      } catch (error) {
        console.error("[GlazierPlugin]", error);
        throw error;
      }
    },
  );
}
