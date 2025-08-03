import { afterAll, beforeEach, describe, expect, it } from "bun:test";

import { ImportTag, pathAttributesByTagName } from "../importTags";
import { rewriteIncludePaths } from "../rewriteIncludePaths";

describe("rewriteIncludePaths", () => {
  const inputDir = "/project/src";
  const includePath = "/project/src/includes/partial.html";

  const originalModuleExists = rewriteIncludePaths._moduleExists;

  beforeEach(() => {
    // Stub the `moduleExists` function to always return `true` for testing
    rewriteIncludePaths._moduleExists = (modulePath: string) => true;
  });

  afterAll(() => {
    rewriteIncludePaths._moduleExists = originalModuleExists;
  });

  it("rewrites relative src paths to be relative to inputDir", async () => {
    const html = `<script src="./foo.js"></script>`;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    // ./foo.js resolved from includePath is /project/src/includes/foo.js
    // relative from inputDir is includes/foo.js
    expect(result).toBe(`<script src="./includes/foo.js"></script>`);
  });

  it("does not rewrite absolute src paths", async () => {
    const html = `<script src="/static/bar.js"></script>`;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    expect(result).toBe(`<script src="/static/bar.js"></script>`);
  });

  it("does not rewrite module paths", async () => {
    const html = `<script src="react"></script>`;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    expect(result).toBe(`<script src="react"></script>`);
  });

  it("doesn't throw if a non-processing tag is missing its path attribute", async () => {
    const html = `<script></script>`;

    expect(() =>
      rewriteIncludePaths(inputDir, includePath, html),
    ).not.toThrow();
  });

  it("throws if a processing tag is missing its path attribute", async () => {
    const html = `<knyt-include></knyt-include>`;

    expect(() => rewriteIncludePaths(inputDir, includePath, html)).toThrow();
  });

  it("skips tags without src if not a processing tag", async () => {
    const html = `<link rel="stylesheet">`;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    expect(result).toBe(`<link rel="stylesheet">`);
  });

  it("rewrites multiple import tags", async () => {
    const html = `
      <script src="./foo.js"></script>
      <script src="./bar.js"></script>
    `;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    expect(result).toBe(`
      <script src="./includes/foo.js"></script>
      <script src="./includes/bar.js"></script>
    `);
  });

  it("does not rewrite if module does not exist and not a processing tag", async () => {
    rewriteIncludePaths._moduleExists = (modulePath: string) => {
      return modulePath.includes("found");
    };

    const html = `
      <script src="./found.js"></script>
      <script src="./missing.js"></script>
    `;
    const result = rewriteIncludePaths(inputDir, includePath, html);

    expect(result).toBe(`
      <script src="./includes/found.js"></script>
      <script src="./missing.js"></script>
    `);
  });

  describe("tag support", () => {
    Object.values(ImportTag).forEach((tagName) => {
      const attributes = pathAttributesByTagName[tagName];

      for (const attribute of attributes) {
        it(`rewrites ${tagName} tag with ${attribute} attribute`, async () => {
          const html = `<${tagName} ${attribute}="./foo.js"></${tagName}>`;
          const result = rewriteIncludePaths(inputDir, includePath, html);

          expect(result).toBe(
            `<${tagName} ${attribute}="./includes/foo.js"></${tagName}>`,
          );
        });
      }
    });
  });
});
