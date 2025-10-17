import { defineView, html, type View } from "@knyt/weaver";

import {
  assertBunHTMLBundleModule,
  prepareHtmlForTransformation,
  type BunHTMLBundleModule,
} from "./transform/utils.ts";

/**
 * A template created from an HTML import.
 *
 * @remarks
 *
 * Templates created from HTML imports can not accept any props,
 * children, or keys.
 *
 * @public
 */
export type HTMLTemplate = View<{}, {}>;

/**
 * Creates a template from an HTML import.
 *
 * @example
 *
 * ```ts
 * import { html } from "@knyt/weaver";
 * import { loadHtmlTemplate } from "@knyt/glazier";
 *
 * const htmlTemplates = HTMLTemplateFactory.relativeTo(import.meta.dir);
 * const Header = await htmlTemplates.define(import("./header.html"));
 *
 * html.main.$children(Header());
 * ```
 *
 * @alpha This API is experimental and WILL change in future releases.
 */
export class HTMLTemplateFactory {
  static relativeTo(inputDir: string) {
    return new HTMLTemplateFactory(inputDir);
  }

  #inputDir: string;

  constructor(inputDir: string) {
    this.#inputDir = inputDir;
  }

  async define(
    bundlePromise: Promise<BunHTMLBundleModule>,
  ): Promise<HTMLTemplate> {
    const bundle = await bundlePromise;

    assertBunHTMLBundleModule(bundle);

    const includePath = bundle.default.index;
    const htmlText = await Bun.file(includePath).text();
    const nextHtmlText = await prepareHtmlForTransformation({
      inputDir: this.#inputDir,
      includePath,
      htmlText,
      frontmatterSrc: includePath,
    });

    return defineView(() => html.fragment.$innerHTML(nextHtmlText));
  }
}
