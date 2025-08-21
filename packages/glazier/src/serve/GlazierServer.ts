import type { RouterTypes } from "bun";

import defaultGlazierPlugin from "../plugin";
import { originServerState } from "../RequestState/mod";
import {
  assertBunHTMLBundleModule,
  transform,
  type BunHTMLBundleModule,
  type GlazierPluginOptions,
  type TransformOptions,
} from "../transform/mod";

// Banned globals
declare const document: never;
declare const window: never;

/**
 * @internal scope: package
 */
export class GlazierServer<RoutePath extends string> {
  #htmlModulePromise: Promise<BunHTMLBundleModule>;
  #options: GlazierPluginOptions;

  constructor(
    htmlModulePromise: Promise<BunHTMLBundleModule>,
    options: GlazierPluginOptions = defaultGlazierPlugin.options,
  ) {
    this.#htmlModulePromise = htmlModulePromise.then(
      (htmlModule) => (assertBunHTMLBundleModule(htmlModule), htmlModule),
    );
    this.#options = options;
  }

  static #responseInit: ResponseInit = {
    headers: {
      "Content-Type": "text/html",
    },
  };

  #originalHtmlText: string | undefined;

  async #getHtml(): Promise<{
    inputPath: string;
    text: string;
  }> {
    const htmlModule = await this.#htmlModulePromise;
    const inputPath = htmlModule.default.index;

    if (this.#originalHtmlText === undefined) {
      this.#originalHtmlText = await Bun.file(inputPath).text();
    }

    return {
      inputPath,
      text: this.#originalHtmlText,
    };
  }

  /**
   * Handles incoming requests and serves the HTML bundle.
   *
   * @detachable
   */
  readonly fetch: RouterTypes.RouteHandler<RoutePath> = async (
    request,
    server,
  ) => {
    const { inputPath, text } = await this.#getHtml();
    const options: TransformOptions = { ...this.#options, request };
    const transformResult = await transform(inputPath, text, options);

    originServerState.associate(request, server);

    const {
      html,
      // TODO: Implement dynamic dependency injection. This should be optional
      // and completely transparent for the user.
      rendererModulePaths: _rendererModulePaths,
    } = transformResult;

    return new Response(html, GlazierServer.#responseInit);
  };
}
