import type { BunKnytConfig, GetRequestProps, IncludeOptions } from "./types";

export function defineConfig(config: BunKnytConfig): BunKnytConfig {
  return config;
}

export function defineIncludeOptions(options: IncludeOptions): IncludeOptions {
  return options;
}

export function defineGetRequestProps<P extends Record<string, any>>(
  getRequestProps: GetRequestProps<P>,
): GetRequestProps<P> {
  return getRequestProps;
}
