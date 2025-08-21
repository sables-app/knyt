import type { BunRequest } from "bun";

import type { TransformerRenderOptions } from "../types";

/**
 * @public
 */
// TODO: Add an option for an abort signal
// TODO: Add an option for a timeout
// TODO: Add an option to limit the number of iterations
export type GlazierPluginOptions = GlazierPluginOptions.Mutable &
  GlazierPluginOptions.Middleware;

export namespace GlazierPluginOptions {
  export type Mutable = {
    /**
     * The cache ID to use for the plugin.
     * This is used to create a unique cache directory for the plugin.
     */
    cacheId?: string;
    /**
     * A flag to enable debug mode.
     * This will enable verbose logging and other debug features.
     */
    debug?: boolean;
  };

  export type Middleware = {
    /**
     * A function that is called before the request is made.
     * This can be used to modify the request and/or trigger some side effects.
     *
     * @public
     */
    onRequest?: GlazierPluginOptions.OnRequest;
    /**
     * A function that is called before the renderer is configured.
     * This can be used to modify the render options.
     *
     * @public
     */
    onConfigureRender?: GlazierPluginOptions.OnConfigureRender;
  };

  export type OnRequest = (request: BunRequest) => Promise<BunRequest | void>;

  export type OnConfigureRender = (
    inputPath: string,
  ) => Promise<TransformerRenderOptions>;
}
