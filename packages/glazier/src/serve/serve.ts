import type {
  BunHTMLBundleModule,
  GlazierPluginOptions,
} from "../transform/mod";
import { GlazierServer, type GlazierServerFetch } from "./GlazierServer";

/**
 * Creates a Bun request handler that serves HTML content
 * using the Knyt Glazier plugin.
 *
 * @param htmlModulePromise - A promise that resolves to a Bun HTML bundle module.
 * @param options - Optional configuration for the Glazier plugin. Defaults to the options of the default plugin instance.
 *
 * This function is designed to be used with Bun's native server,
 * allowing you to serve HTML content that can include Knyt views, components, and other server-side includes.
 *
 * @beta This API is experimental and subject to change.
 */
export function serve(
  htmlModulePromise: Promise<BunHTMLBundleModule>,
  options?: GlazierPluginOptions,
): GlazierServerFetch {
  return new GlazierServer(htmlModulePromise, options).fetch;
}
