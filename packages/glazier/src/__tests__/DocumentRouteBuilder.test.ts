import { beforeAll, describe, expect, it, mock } from "bun:test";

import { findRootPath, generateRoutePathname } from "../DocumentRouteBuilder";

describe("DocumentRouteBuilder", () => {
  describe("findRootPath", () => {
    it("should find the root path for a given module paths", () => {
      const documentPaths = [
        "@knyt/foo/docs/getting-started.md",
        "@knyt/foo/docs/installation.md",
        "@knyt/foo/docs/components.md",
        "@knyt/foo/docs/advanced.md",
        "@knyt/foo/docs/advanced/routing.md",
        "@knyt/foo/docs/advanced/state.md",
        "@knyt/foo/docs/advanced/ssr.md",
        "@knyt/foo/docs/advanced/ssg.md",
      ];
      const result = findRootPath(documentPaths);

      expect(result).toBe("@knyt/foo/docs");
    });

    it("should return the root path when all paths are the same", () => {
      const documentPaths = [
        "@knyt/foo/docs/getting-started.md",
        "@knyt/foo/docs/getting-started.md",
        "@knyt/foo/docs/getting-started.md",
      ];
      const result = findRootPath(documentPaths);

      expect(result).toBe("@knyt/foo/docs/getting-started.md");
    });

    it("should return the root path when there is only one path", () => {
      const documentPaths = ["@knyt/foo/docs/getting-started.md"];
      const result = findRootPath(documentPaths);

      expect(result).toBe("@knyt/foo/docs/getting-started.md");
    });

    it("should return an empty string when there are no paths", () => {
      const documentPaths: string[] = [];
      const result = findRootPath(documentPaths);

      expect(result).toBe("");
    });

    it("should return an empty string when the paths do not share a common root", () => {
      const documentPaths = [
        "@knyt/foo/docs/getting-started.md",
        "bar/docs/installation.md",
        "baz/docs/components.md",
      ];
      const result = findRootPath(documentPaths);

      expect(result).toBe("");
    });

    it("should handle Windows-style paths", () => {
      const documentPaths = [
        "@knyt\\foo\\docs\\getting-started.md",
        "@knyt\\foo\\docs\\installation.md",
        "@knyt\\foo\\docs\\components.md",
      ];
      const result = findRootPath(documentPaths);

      expect(result).toBe("@knyt\\foo\\docs");
    });
  });

  describe("generateRoutePathname", () => {
    it("should generate a route pathname by removing the root and extension", () => {
      const root = "@knyt/foo/docs";
      const documentPath = "@knyt/foo/docs/getting-started.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/getting-started");
    });

    it("should generate a route pathname for nested paths", () => {
      const root = "@knyt/foo/docs";
      const documentPath = "@knyt/foo/docs/advanced/routing.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/advanced/routing");
    });

    it("should generate a route pathname for base paths", () => {
      const root = "@knyt/foo/docs";
      const documentPath = "@knyt/foo/docs/index.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/");
    });

    it("should handle empty root", () => {
      const root = "";
      const documentPath = "foo/bar/baz.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/foo/bar/baz");
    });

    describe("when root not present in document path", () => {
      it("should generate a route pathname", () => {
        const root = "/not/present";
        const documentPath = "/foo/bar/baz.md";
        const result = generateRoutePathname(root, documentPath);

        expect(result).toBe("/foo/bar/baz");
      });

      it("should handle Windows-style paths", () => {
        const root = "C:\\not\\present";
        const documentPath = "C:\\foo\\bar\\baz.md";
        const result = generateRoutePathname(root, documentPath);

        expect(result).toBe("/foo/bar/baz");
      });
    });

    it("should handle document path with no extension", () => {
      const root = "/foo/bar";
      const documentPath = "/foo/bar/baz";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/baz");
    });

    it("should handle Windows-style paths", () => {
      const root = "C:\\foo\\docs";
      const documentPath = "C:\\foo\\docs\\advanced\\routing.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/advanced/routing");
    });

    it("should return empty string if document path equals root", () => {
      const root = "foo/bar";
      const documentPath = "foo/bar.md";
      const result = generateRoutePathname(root, documentPath);

      expect(result).toBe("/");
    });
  });

  describe.todo("getHtmlPath");
});
