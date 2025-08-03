import path from "node:path";

/**
 * Returns a relative path from `fromPath` to `toPath`, prefixed with `./` if the
 * relative path does not start with `../` or `./`.
 */
export function relativePathWithDotSlash(
  fromPath: string,
  toPath: string,
): string {
  const relativePath = path.relative(fromPath, toPath);

  if (isRelativePathWithDotSlash(relativePath)) {
    return relativePath;
  }

  return `./${relativePath}`;
}

export function isRelativePathWithDotSlash(filePath: string): boolean {
  return filePath.startsWith("../") || filePath.startsWith("./");
}
