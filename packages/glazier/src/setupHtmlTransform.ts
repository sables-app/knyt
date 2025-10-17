import type { PluginBuilder } from "bun";

import { DependencyManager } from "./DependencyManager.ts";
import { DependencyTracker } from "./DependencyTracker.ts";
import { transform } from "./transform/mod.ts";
import type { MiddlewareConfig } from "./types.ts";

/**
 * Set up the HTML transform for the plugin.
 */
export function setupHtmlTransform(
  builder: PluginBuilder,
  dependencyManager: DependencyManager,
  middleware: MiddlewareConfig,
): void {
  const dependencyTracker = new DependencyTracker();

  builder.onLoad({ filter: /\.html$/ }, async ({ path: inputPath, defer }) => {
    try {
      const fileText = Bun.file(inputPath).text();
      const [html] = await Promise.all([fileText, defer()]);
      const transformResult = await transform(inputPath, html, middleware);
      const contents = await dependencyManager.inject(transformResult);

      dependencyTracker.track(transformResult);

      return {
        contents,
        loader: "html",
      };
    } catch (error) {
      console.error("[GlazierPlugin]", error);
      throw error;
    }
  });
}
