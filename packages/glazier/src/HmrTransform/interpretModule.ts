import type { CallExpression, MemberExpression, ParseResult } from "oxc-parser";

/**
 * Names of packages that we want to specially handle.
 */
const recognizedPackageNames = ["knyt", "@knyt/luthier"];

/**
 * How a `define.element(...)` call was made.
 *
 * @internal scope: package
 */
export enum CallKind {
  /**
   * A direct call to `define.element(...)`.
   */
  DefineCall = "DefineCall",
  /**
   * A namespaced call to `knyt.define.element(...)`.
   */
  NamespacedDefineCall = "NamespacedDefineCall",
}

/**
 * How a defined element is exported from the module.
 *
 * @internal scope: package
 */
export enum ExportKind {
  /**
   * The defined element is a named export.
   */
  Named = "Named",
  /**
   * The defined element is the default export.
   */
  Default = "Default",
}

/**
 * A `define.element(...)` call found in the AST.
 *
 * @internal scope: package
 */
export type DefineElementExpression = {
  /**
   * What kind of call was used to define the element.
   */
  callKind: CallKind;
  /**
   * The tag name passed to `define.element(...)`.
   */
  tagName: string;
  /**
   * How the defined element is exported, if at all.
   */
  exportKind: ExportKind | undefined;
  /**
   * The name of the export, if any.
   *
   * @remarks
   *
   * If the defined element is:
   * - a named export, this will be the name of the export.
   * - the default export, this will be `"default"`.
   * - not exported, this will be `undefined`.
   */
  exportName: string | undefined | "default";
};

/**
 * An interpreted module, with information extracted from the AST.
 *
 * @internal scope: package
 */
export class InterpretedModule {
  /**
   * The original parse result from `oxc-parser`.
   */
  #result: ParseResult;

  /**
   * Whether any imports from `knyt` or `@knyt/luthier` were found.
   * This includes any import, not just `define`.
   */
  get hasKnytImports(): boolean {
    return this.knytPackageNames.size > 0;
  }
  /**
   * Whether any top-level `define.element(...)` calls were found.
   */
  get hasDefinedElements(): boolean {
    return this.definedElements.length > 0;
  }
  /**
   * The local name that `define` was imported as, if any.
   * This is used for named imports, e.g., `import { define } from 'knyt'`
   * or `import { define as knytDefine } from 'knyt'`.
   */
  knytDefineLocalNames = new Set<string>();
  /**
   * The local name that the `knyt` module was imported as, if any.
   * This is used for namespace imports, e.g., `import * as knyt from 'knyt'`.
   * In this case, we would look for calls to `knyt.define.element(...)`.
   */
  knytModuleLocalNames = new Set<string>();
  /**
   * The package name that `define` was imported from, if any.
   * This will be either `knyt` or `@knyt/luthier` if `define` was imported.
   */
  knytPackageNames = new Set<string>();
  /**
   * Elements defined via `define.element(...)`
   * calls at the top level of the module.
   */
  definedElements: Array<DefineElementExpression> = [];

  #interpretImports(): void {
    for (const node of this.#result.program.body) {
      if (
        node.type === "ImportDeclaration" &&
        recognizedPackageNames.includes(node.source.value)
      ) {
        this.knytPackageNames.add(node.source.value);

        for (const specifier of node.specifiers) {
          // Handle named imports e.g., `import { define } from "knyt";`
          // or `import { define as knytDefine } from "knyt";`
          if (
            specifier.type === "ImportSpecifier" &&
            "name" in specifier.imported &&
            specifier.imported.name === "define"
          ) {
            // In this case, the pattern would be `define.element(...)`
            this.knytDefineLocalNames.add(specifier.local.name);
            break;
          }

          // Handle namespace imports e.g., `import * as knyt from "knyt";`
          if (specifier.type === "ImportNamespaceSpecifier") {
            // In this case, the pattern would be `knyt.define.element(...)`
            this.knytModuleLocalNames.add(specifier.local.name);
            // this.knytDefineLocalNames.push("define");
            break;
          }
        }
      }
    }
  }

  /**
   * Determine if the callee is a call to `define.element(...)`
   * based on the imported local names.
   */
  #isDefineElementCallee(callee: MemberExpression): boolean {
    return (
      callee.type === "MemberExpression" &&
      callee.object.type === "Identifier" &&
      this.knytDefineLocalNames.has(callee.object.name) &&
      callee.property.type === "Identifier" &&
      callee.property.name === "element"
    );
  }

  /**
   * Determine if the callee is a call to `knyt.define.element(...)`
   * based on the imported local names.
   */
  #isNamespacedDefineElementCallee(callee: MemberExpression): boolean {
    return (
      callee.type === "MemberExpression" &&
      callee.object.type === "MemberExpression" &&
      callee.object.object.type === "Identifier" &&
      this.knytModuleLocalNames.has(callee.object.object.name) &&
      callee.object.property.type === "Identifier" &&
      callee.object.property.name === "define" &&
      callee.property.type === "Identifier" &&
      callee.property.name === "element"
    );
  }

  #getTagNameFromCallExpr(expr: CallExpression): string | undefined {
    const tagNameArg = expr.arguments.at(0);
    const tagNameArgValue =
      tagNameArg?.type === "Literal" ? tagNameArg.value : undefined;

    return typeof tagNameArgValue === "string" ? tagNameArgValue : undefined;
  }

  /**
   * Traverse the AST to find top-level calls to `define.element(...)`
   */
  #interpretDefineElement(): void {
    if (!this.hasKnytImports || !this.knytDefineLocalNames) return;

    for (const node of this.#result.program.body) {
      if (
        node.type !== "ExpressionStatement" ||
        node.expression.type !== "CallExpression" ||
        node.expression.callee.type !== "MemberExpression" ||
        !this.#isDefineElementCallee(node.expression.callee)
      ) {
        continue;
      }

      // Found a top-level call to `define.element(...)`

      const tagName = this.#getTagNameFromCallExpr(node.expression);

      if (!tagName) continue;

      this.definedElements.push({
        callKind: CallKind.DefineCall,
        tagName,
        exportName: undefined,
        exportKind: undefined,
      });
    }
  }

  #interpretNamespacedDefineElement(): void {
    if (!this.hasKnytImports || !this.knytModuleLocalNames) return;

    for (const node of this.#result.program.body) {
      if (
        node.type !== "ExpressionStatement" ||
        node.expression.type !== "CallExpression" ||
        node.expression.callee.type !== "MemberExpression" ||
        !this.#isNamespacedDefineElementCallee(node.expression.callee)
      ) {
        continue;
      }

      // Found a top-level call to `knyt.define.element(...)`

      const tagName = this.#getTagNameFromCallExpr(node.expression);

      if (!tagName) continue;

      this.definedElements.push({
        callKind: CallKind.NamespacedDefineCall,
        tagName,
        exportName: undefined,
        exportKind: undefined,
      });
    }
  }

  #getCallKindFromCallee(expr: MemberExpression): CallKind | undefined {
    if (this.#isDefineElementCallee(expr)) {
      return CallKind.DefineCall;
    } else if (this.#isNamespacedDefineElementCallee(expr)) {
      return CallKind.NamespacedDefineCall;
    } else {
      return undefined;
    }
  }

  #interpretNamedExportedDefineElement(): void {
    if (!this.hasKnytImports) return;

    for (const node of this.#result.program.body) {
      if (
        node.type !== "ExportNamedDeclaration" ||
        !node.declaration ||
        node.declaration.type !== "VariableDeclaration" ||
        // The pattern must be a `const` declaration
        node.declaration.kind !== "const" ||
        // There must be exactly one declaration
        node.declaration.declarations.length !== 1
      ) {
        continue;
      }

      const constant = node.declaration.declarations[0];

      if (
        constant.type !== "VariableDeclarator" ||
        constant.id.type !== "Identifier" ||
        constant.init?.type !== "CallExpression" ||
        constant.init.callee.type !== "MemberExpression"
      ) {
        continue;
      }

      const callKind = this.#getCallKindFromCallee(constant.init.callee);

      if (!callKind) continue;

      // Found either a named export of a call to
      // 1. `define.element(...)`
      // 2. `knyt.define.element(...)`

      const tagName = this.#getTagNameFromCallExpr(constant.init);

      if (!tagName) continue;

      const exportName = constant.id.name;

      this.definedElements.push({
        callKind,
        tagName,
        exportKind: ExportKind.Named,
        exportName,
      });
    }
  }

  #interpretDefaultExportedDefineElement(): void {
    if (!this.hasKnytImports) return;

    for (const node of this.#result.program.body) {
      if (
        node.type !== "ExportDefaultDeclaration" ||
        node.declaration.type !== "CallExpression" ||
        node.declaration.callee.type !== "MemberExpression"
      ) {
        continue;
      }

      const callKind = this.#getCallKindFromCallee(node.declaration.callee);

      if (!callKind) continue;

      // Found a default export of a call to
      // 1. `define.element(...)`
      // 2. `knyt.define.element(...)`

      const tagName = this.#getTagNameFromCallExpr(node.declaration);

      if (!tagName) continue;

      this.definedElements.push({
        callKind,
        tagName,
        exportKind: ExportKind.Default,
        exportName: "default",
      });
    }
  }

  constructor(result: ParseResult) {
    this.#result = result;

    // First, interpret imports to find local names
    this.#interpretImports();

    // Then, look for top-level define.element calls
    // using the imported local names
    this.#interpretDefineElement();
    this.#interpretNamespacedDefineElement();
    this.#interpretNamedExportedDefineElement();
    this.#interpretDefaultExportedDefineElement();
  }
}

/**
 * Interpret a parsed module to extract information about `define.element(...)` calls.
 *
 * @param result - The parse result from `oxc-parser`.
 * @returns The interpreted module information.
 *
 * @internal scope: package
 */
export function interpretModule(result: ParseResult): Readonly<InterpretedModule> {
  return Object.freeze(new InterpretedModule(result));
}
