import { dirname, resolve } from "node:path";

import { getPackageJson, type PackageJson } from "./getPackageJson.ts";

/**
 * Finds the closest package.json that depends on your library.
 */
export async function findRelevantPackageName(
  startDir = process.cwd(),
): Promise<string | null> {
  const selfPackageName = (await getPackageJson()).name;

  let dir = startDir;

  while (dir !== "/") {
    try {
      const potentialPackageJsonFile = Bun.file(resolve(dir, "package.json"));

      if (await !potentialPackageJsonFile.exists()) {
        // No package.json here, move up
        dir = dirname(dir);
        continue;
      }

      const potentialPackageJson =
        (await potentialPackageJsonFile.json()) as PackageJson;

      // Check if this package depends on your library
      const isDependency =
        potentialPackageJson.dependencies?.[selfPackageName] ||
        potentialPackageJson.devDependencies?.[selfPackageName] ||
        potentialPackageJson.peerDependencies?.[selfPackageName];

      if (isDependency) {
        return potentialPackageJson.name;
      }

      // Move up to parent directory
      dir = dirname(dir);
    } catch (err) {
      // Failed to read package.json, possibly due to invalid JSON or permission issues.
      // Error is ignored; proceed to the parent directory.
      dir = dirname(dir);
    }
  }

  // No relevant package.json found
  return null;
}
