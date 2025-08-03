import { describe, expect, it } from "bun:test";

import { pathAttributesByTagName, ResourceTag } from "../importTags";
import { rewriteRelativeResourceTags } from "../rewriteRelativeResourceTags";

describe("rewriteRelativeResourceTags", () => {
  it("rewrites relative resource tag paths to absolute paths", () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="./main.css">
          <script src="./bundle.js"></script>
        </head>
        <body>
          <img src="./logo.png">
        </body>
      </html>
    `;
    const assetFileNames = ["main.css", "bundle.js", "logo.png"];
    const result = rewriteRelativeResourceTags(html, assetFileNames);

    expect(result).toContain('<link rel="stylesheet" href="/main.css">');
    expect(result).toContain('<script src="/bundle.js">');
    expect(result).toContain('<img src="/logo.png">');
  });

  it("does not rewrite absolute or non-matching paths", () => {
    const html = `
      <img src="/already-absolute.png">
      <img src="http://example.com/external.png">
      <img src="./not-in-assets.png">
    `;
    const assetFileNames = ["logo.png"];
    const result = rewriteRelativeResourceTags(html, assetFileNames);

    expect(result).toContain('<img src="/already-absolute.png">');
    expect(result).toContain('<img src="http://example.com/external.png">');
    expect(result).toContain('<img src="./not-in-assets.png">');
  });

  it("skips tags without relevant path attributes", () => {
    const html = `<div class="no-resource"></div>`;
    const assetFileNames = ["main.css"];
    const result = rewriteRelativeResourceTags(html, assetFileNames);

    expect(result).toBe('<div class="no-resource"></div>');
  });

  it("is case-insensitive for attribute names", () => {
    const html = `<IMG SRC="./logo.png">`;
    const assetFileNames = ["logo.png"];
    const result = rewriteRelativeResourceTags(html, assetFileNames);

    expect(result).toContain('<IMG SRC="/logo.png">');
  });

  describe("tag support", () => {
    Object.values(ResourceTag).forEach((tagName) => {
      const attributes = pathAttributesByTagName[tagName];

      for (const attribute of attributes) {
        it(`rewrites ${tagName} tag with ${attribute} attribute`, () => {
          const html = `<${tagName} ${attribute}="./logo.png"></${tagName}>`;
          const assetFileNames = ["logo.png"];
          const result = rewriteRelativeResourceTags(html, assetFileNames);

          expect(result).toBe(
            `<${tagName} ${attribute}="/logo.png"></${tagName}>`,
          );
        });
      }
    });
  });

  describe("with `pathPrefix` option", () => {
    it("rewrites paths with the specified relative path", () => {
      const html = `<link rel="stylesheet" href="./style.css">`;
      const assetFileNames = ["style.css"];
      const pathPrefix = "assets";
      const result = rewriteRelativeResourceTags(
        html,
        assetFileNames,
        pathPrefix,
      );

      expect(result).toContain(
        '<link rel="stylesheet" href="/assets/style.css">',
      );
    });

    it("handles empty pathPrefix", () => {
      const html = `<script src="./script.js"></script>`;
      const assetFileNames = ["script.js"];
      const pathPrefix = "";
      const result = rewriteRelativeResourceTags(
        html,
        assetFileNames,
        pathPrefix,
      );

      expect(result).toContain('<script src="/script.js">');
    });

    it("handles undefined pathPrefix", () => {
      const html = `<img src="./image.png">`;
      const assetFileNames = ["image.png"];
      const result = rewriteRelativeResourceTags(html, assetFileNames);

      expect(result).toContain('<img src="/image.png">');
    });

    it("handle a web address as a pathPrefix", () => {
      const html = `<link rel="stylesheet" href="./style.css">`;
      const assetFileNames = ["style.css"];
      const pathPrefix = "http://example.com/assets";
      const result = rewriteRelativeResourceTags(
        html,
        assetFileNames,
        pathPrefix,
      );

      expect(result).toContain(
        '<link rel="stylesheet" href="http://example.com/assets/style.css">',
      );
    });

    it("handle a complex web address as a pathPrefix", () => {
      const html = `<link rel="stylesheet" href="./style.css">`;
      const assetFileNames = ["style.css"];
      const pathPrefix = "https://subdomain.example.com/assets?version=1.0#foo";
      const result = rewriteRelativeResourceTags(
        html,
        assetFileNames,
        pathPrefix,
      );

      expect(result).toContain(
        '<link rel="stylesheet" href="https://subdomain.example.com/assets/style.css?version=1.0#foo">',
      );
    });
  });
});
