import { describe, expect, it } from "bun:test";
import { parseSync, type ParseResult } from "oxc-parser";

import { CallKind, ExportKind, interpretModule } from "../interpretModule.ts";

describe("interpretModule", () => {
  const options = {
    lang: "ts",
    sourceType: "module",
    astType: "ts",
  } as const;

  async function getFixtureAst(relativePath: string): Promise<ParseResult> {
    const fileUrl = new URL(relativePath, import.meta.url);
    const script = await Bun.file(fileUrl).text();

    return parseSync(relativePath, script, options);
  }

  function jsAst([src]: TemplateStringsArray): ParseResult {
    return parseSync("test.ts", src, options);
  }

  describe("imports", () => {
    it("determines that a knyt package was not imported", async () => {
      const result = jsAst`import { somethingElse } from "some-other-package";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(false);
      expect(interpreted.hasDefinedElements).toBe(false);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(interpreted.knytDefineLocalNames).toHaveLength(0);
      expect(interpreted.knytPackageNames).toHaveLength(0);
    });

    it("determines that `define` was not imported", async () => {
      const result = jsAst`import { somethingElse } from "knyt";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytDefineLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytPackageNames)).toEqual(["knyt"]);
    });

    it("determines that `define` is imported from `knyt`", async () => {
      const result = jsAst`import { define } from "knyt";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual(["define"]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual(["knyt"]);
    });

    it("determines that `define` is imported from `@knyt/luthier`", async () => {
      const result = jsAst`import { define } from "@knyt/luthier";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual(["define"]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual([
        "@knyt/luthier",
      ]);
    });

    it("determines that `define` is imported with a different local name", async () => {
      const result = jsAst`import { define as knytDefine } from "knyt";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual([
        "knytDefine",
      ]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual(["knyt"]);
    });

    it("determines that `define` is imported with a different local name from `@knyt/luthier`", async () => {
      const result = jsAst`import { define as knytLuthierDefine } from "@knyt/luthier";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual([
        "knytLuthierDefine",
      ]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual([
        "@knyt/luthier",
      ]);
    });

    it("determines that `define` is imported via a namespace import", async () => {
      const result = jsAst`import * as knyt from "knyt";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(Array.from(interpreted.knytModuleLocalNames)).toEqual(["knyt"]);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual([]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual(["knyt"]);
    });

    it("determines that `define` is imported via a namespace import from `@knyt/luthier`", async () => {
      const result = jsAst`import * as knytLuthier from "@knyt/luthier";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(Array.from(interpreted.knytModuleLocalNames)).toEqual([
        "knytLuthier",
      ]);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual([]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual([
        "@knyt/luthier",
      ]);
    });

    it("determines that `define` is imported with other imports", async () => {
      const result = jsAst`import { somethingElse, define, anotherThing } from "knyt";`;
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.knytModuleLocalNames).toHaveLength(0);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual(["define"]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual(["knyt"]);
    });
  });

  describe("top-level define.element call", () => {
    it("detects a top-level define.element call", async () => {
      const result = jsAst`
        import { define } from "knyt";
        define.element("my-element", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.DefineCall,
        tagName: "my-element",
        exportKind: undefined,
        exportName: undefined,
      });
    });

    it("detects a top-level define.element call with a renamed import", async () => {
      const result = jsAst`
        import { define as knytDefine } from "knyt";
        knytDefine.element("big-one", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.DefineCall,
        tagName: "big-one",
        exportKind: undefined,
        exportName: undefined,
      });
    });

    it("detects a top-level namespaced define.element call", async () => {
      const result = jsAst`
        import * as knyt from "knyt";
        knyt.define.element("middle-two", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.NamespacedDefineCall,
        tagName: "middle-two",
        exportKind: undefined,
        exportName: undefined,
      });
    });

    it("does not detect a define.element call inside a function", async () => {
      const result = jsAst`
        import { define } from "knyt";
        function register() {
          define.element("my-element", { lifecycle() {} });
        }
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(0);
    });
  });

  describe("named exported definitions from define.element", () => {
    it("detects a named export of a define.element call", async () => {
      const result = jsAst`
        import { define } from "knyt";
        export const MyElement = define.element("my-element", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.DefineCall,
        tagName: "my-element",
        exportKind: ExportKind.Named,
        exportName: "MyElement",
      });
    });

    it("detects a named export of a namespaced define.element call", async () => {
      const result = jsAst`
        import * as knyt from "knyt";
        export const YourElement = knyt.define.element("your-element", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.NamespacedDefineCall,
        tagName: "your-element",
        exportKind: ExportKind.Named,
        exportName: "YourElement",
      });
    });
  });

  describe("default exported definitions from define.element", () => {
    it("detects a default export of a define.element call", async () => {
      const result = jsAst`
        import { define } from "knyt";
        export default define.element("my-element", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.DefineCall,
        tagName: "my-element",
        exportKind: ExportKind.Default,
        exportName: "default",
      });
    });

    it("detects a default export of a namespaced define.element call", async () => {
      const result = jsAst`
        import * as knyt from "knyt";
        export default knyt.define.element("your-element", { lifecycle() {} });
      `;
      const interpreted = interpretModule(result);

      expect(interpreted.definedElements).toHaveLength(1);
      expect(interpreted.definedElements[0]).toEqual({
        callKind: CallKind.NamespacedDefineCall,
        tagName: "your-element",
        exportKind: ExportKind.Default,
        exportName: "default",
      });
    });
  });

  describe("fixtures", () => {
    it("accurately interprets the mixed definitions", async () => {
      const result = await getFixtureAst("./fixtures/mixed.ts");
      const interpreted = interpretModule(result);

      expect(interpreted.hasKnytImports).toBe(true);
      expect(interpreted.hasDefinedElements).toBe(true);

      expect(Array.from(interpreted.knytModuleLocalNames)).toEqual([
        "knytLuthier",
      ]);
      expect(Array.from(interpreted.knytDefineLocalNames)).toEqual([
        "knytDefine",
        "define",
      ]);
      expect(Array.from(interpreted.knytPackageNames)).toEqual([
        "@knyt/luthier",
        "knyt",
      ]);
      expect(interpreted.definedElements).toHaveLength(3);
      expect(interpreted.definedElements).toEqual([
        {
          callKind: CallKind.DefineCall,
          tagName: "not-exported",
          exportName: undefined,
          exportKind: undefined,
        },
        {
          callKind: CallKind.NamespacedDefineCall,
          tagName: "knyt-button",
          exportKind: ExportKind.Named,
          exportName: "Button",
        },
        {
          callKind: CallKind.DefineCall,
          tagName: "knyt-counter",
          exportKind: ExportKind.Default,
          exportName: "default",
        },
      ]);
    });
  });
});
