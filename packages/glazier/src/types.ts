import type { RenderOptions } from "@knyt/weaver";
import type { BunRequest, Serve, Server } from "bun";

import type { GlazierPluginOptions } from "./transform/mod.ts";

/**
 * Options for module includes.
 *
 * @public
 */
export type IncludeOptions = {
  /**
   * Determines if the module should be loaded on the server only.
   * This is useful for modules that are not needed on the client,
   * such as server-side renderers.
   */
  serverOnly?: boolean;
};

export type BunKnytConfig = {
  /**
   * A callback to modify the request before processing.
   */
  onRequest?: BunKnytConfig.OnRequest;
  /**
   * A callback to modify the render options before rendering.
   */
  onConfigureRender?: BunKnytConfig.OnConfigureRender;
  /**
   * Render options for the transformer.
   */
  render?: TransformerRenderOptions;
};

export namespace BunKnytConfig {
  export type OnRequest = (
    request: BunRequest,
  ) => BunRequest | void | Promise<BunRequest | void>;

  export type OnConfigureRender = (
    /**
     * The path to the input file of the current render.
     */
    inputPath: string,
    /**
     * Render options provided through the `render` property in the configuration.
     */
    renderOptions: TransformerRenderOptions,
  ) =>
    | TransformerRenderOptions
    | void
    | Promise<TransformerRenderOptions | void>;
}

/**
 * Transformer options for rendering.
*
* @remarks
*
* These are the `RenderOptions` excluding the `document`,
* which is created internally for each transformation
* to ensure isolation. Render options for the `Transformer`
* are different from the ones for the `render` function.
*
 * @defaultValue
 *
 * {
 *   disableKeyAttributes: false,
 *   enableWhitespace: false,
 *   reactiveElementTimeout: 20,
 * }
 */
export type TransformerRenderOptions = Omit<RenderOptions, "document">;

export type GetRequestProps<
  P extends Record<string, any> = Record<string, unknown>,
> = (
  request: BunRequest<string>,
  props: P,
) => Promise<GetRequestProps.Result<P> | void>;

export namespace GetRequestProps {
  export type Result<P extends Record<string, any> = Record<string, unknown>> =
    {
      props?: P;
      response?: ResponseInit;
    };
}

/**
 * A fully defined set of plugin middleware.
 *
 * @internal scope: package
 */
export type MiddlewareConfig = Readonly<
  Required<GlazierPluginOptions.Middleware>
>;

/**
 * A Bun route handler type.
 *
 * @internal scope: package
 */
export type RouteHandler<Path extends string, WebSocketData = any> = Serve.Handler<
  BunRequest<Path>,
  Server<WebSocketData>,
  Response
>;

