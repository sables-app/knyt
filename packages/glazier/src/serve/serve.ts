import type {
  BunHTMLBundleModule,
  GlazierPluginOptions,
} from "../transform/mod";
import { GlazierServer } from "./GlazierServer";

/**
 * @alpha This API is experimental and subject to change.
 */
export function serve(
  htmlModulePromise: Promise<BunHTMLBundleModule>,
  options: GlazierPluginOptions = {},
) {
  return new GlazierServer(htmlModulePromise, options).fetch;
}
