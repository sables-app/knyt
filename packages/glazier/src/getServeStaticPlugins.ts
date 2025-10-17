import path from "node:path";

import type { BunPlugin } from "bun";

import { getBunfigToml } from "./getBunfigToml.ts";

/**
 * Attempts to import the list of plugins configured for the static server
 * in the `bunfig.toml` file.
 */
export async function getServeStaticPlugins(
  workingDirectory?: string,
): Promise<BunPlugin[] | undefined> {
  const bunfigToml = await getBunfigToml(workingDirectory);

  if (!bunfigToml) return undefined;

  const { bunfig, filePath } = bunfigToml;
  const plugins = bunfig?.serve?.static?.plugins;

  if (!plugins) return undefined;

  async function importPlugin(pluginModulePath: string): Promise<BunPlugin> {
    const resolvedPath = Bun.resolveSync(
      pluginModulePath,
      path.dirname(filePath),
    );
    const pluginModule = await import(resolvedPath);

    return pluginModule.default;
  }

  return Promise.all(plugins.map(importPlugin));
}
