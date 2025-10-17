import path from "node:path";

import { getHomeDir, getXDGConfigHome } from "./env.ts";

/**
 * Represents the structure of a parsed `bunfig.toml` file.
 */
export type Bunfig = {
  [key: string]: unknown;
  preload?: string[];
  serve?: {
    static?: {
      plugins?: string[];
    };
  };
};

/**
 * Represents the result of reading the `bunfig.toml` file.
 */
export type BunfigToml = {
  filePath: string;
  bunfig: Bunfig;
};

/**
 * Internal cache for the `bunfig.toml` file.
 *
 * @remarks
 *
 * - `null` indicates that the file has not been read yet.
 * - `undefined` indicates that either the file was not found or an error occurred while reading it.
 * - `BunfigTomlResult` indicates that the file was successfully read and parsed.
 */
let result: BunfigToml | null | undefined = null;

/**
 * Reads the `bunfig.toml` file and returns its contents as a JavaScript object.
 *
 * Attempts to read the `bunfig.toml` file from the following locations in order:
 *
 * 1. `./bunfig.toml` in the current working directory
 * 2. `$HOME/.bunfig.toml`
 * 3. `$XDG_CONFIG_HOME/.bunfig.toml`
 *
 * @see https://bun.sh/docs/runtime/bunfig
 */
export async function getBunfigToml(
  workingDirectory = process.cwd(),
): Promise<BunfigToml | undefined> {
  if (result !== null) {
    return result;
  }

  /**
   * @see https://bun.sh/docs/runtime/bunfig#global-vs-local
   */
  const filePaths = [
    path.resolve(workingDirectory, "bunfig.toml"),

    // NOTE: Global config files are prefixed with a dot (.)
    path.resolve(getHomeDir(), ".bunfig.toml"),
    path.resolve(getXDGConfigHome(), ".bunfig.toml"),
  ];

  for (const filePath of filePaths) {
    const file = Bun.file(filePath);

    try {
      if (await file.exists()) {
        result = {
          filePath: filePath,
          bunfig: Bun.TOML.parse(await file.text()) as Bunfig,
        };

        return result;
      }
    } catch (error) {
      console.error(`[glazier] Error reading ${file.name}:`, error);
      // Continue to the next
    }
  }

  // If no file was found, return undefined
  return (result = undefined);
}
