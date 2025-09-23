import type { JavaScriptLoader, PluginBuilder } from "bun";
import { parseSync } from "oxc-parser";

import { interpretModule } from "./interpretModule";

/**
 * File extensions to apply the transform to.
 */
const extensions = ["js", "jsx", "mjs", "cjs", "ts", "tsx"] as const;
/**
 * Regex pattern to match files with the specified extensions.
 */
const filterPattern = new RegExp(`\\.(${extensions.join("|")})$`);
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
 * Code to inject to import the HMR runtime for Glazier.
 *
 * @remarks
 *
 * This import is necessary to enable hot updates for composed Knyt elements.
 * Without this import, errors will occur when modules containing
 * Knyt elements are hot reloaded.
 *
 * Additionally, this import must come before any Knyt elements are defined,
 * because the HMR runtime needs to stub the CustomElementRegistry
 * before any elements are defined. The import is idempotent, so importing
 * it multiple times is safe, but it must be imported at least once.
 *
 * An attempt was made to inject this code in the `DependencyManager`,
 * but that approach was unreliable, because the order of script tags
 * in the HTML is not guaranteed by Bun's HMR. This approach, injecting directly
 * into the module that defines the Knyt elements, is more reliable.
 */
const HMR_IMPORT_CODE = `\nimport "@knyt/glazier/_hmr/runtime";\n`;

/**
 * Configures a JavaScript module transform to inject HMR acceptance code
 * into modules that define composed Knyt elements.
 *
 * @param builder - The plugin builder to apply the transform to.
 */
export function setupHmrTransform(builder: PluginBuilder): void {
  // TODO: Determine if HMR is enabled in the relevant Bun server(s).
  // This may not be possible to do without monkey-patching Bun.
  // For now, we assume HMR is enabled in non-production environments.
  const shouldInjectHmr = import.meta.env.NODE_ENV !== "production";

  if (!shouldInjectHmr) return;

  builder.onLoad(
    { filter: filterPattern },
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
          contents: `${HMR_IMPORT_CODE}${script}${HMR_ACCEPT_CODE}`,
          loader,
        };
      } catch (error) {
        console.error("[GlazierPlugin]", error);
        throw error;
      }
    },
  );
}
