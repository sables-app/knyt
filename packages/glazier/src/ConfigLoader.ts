import { getConfigModulePath, isVerboseEnv } from "./env.ts";
import type { GlazierPluginOptions } from "./transform/mod.ts";
import type { BunKnytConfig, TransformerRenderOptions } from "./types.ts";

const defaultConfig: BunKnytConfig = {};

function getLogger(): Partial<Console> {
  if (isVerboseEnv()) {
    return console;
  }

  return {
    error: console.error,
  };
}

async function importConfigModule(): Promise<BunKnytConfig> {
  const logger = getLogger();
  const configPath = getConfigModulePath();
  const fileExists = await Bun.file(configPath).exists();

  logger.info?.(`Loading Bun Knyt config from ${configPath}...`);

  if (!fileExists) {
    logger.info?.(
      `Config file not found at ${configPath}. Using default config.`,
    );

    return defaultConfig;
  }

  try {
    const { default: config } = await import(configPath);

    return config;
  } catch (error) {
    logger.error?.(`Error importing ${configPath}:`, error);

    return defaultConfig;
  }
}

/**
 * Loads the Bun-Knyt config file and provides methods to
 * handle requests and configure render options.
 *
 * @remarks
 *
 * The config file is primarily useful for projects using
 * static-site generation, where a server is not available.
 * In these cases, the config file can be used to configure
 * the plugin's behavior without needing to create and import
 * a custom instance of the plugin.
 *
 * Otherwise, the config file is not necessary, and middleware
 * can be added directly to the plugin instance.
 */
export class ConfigLoader {
  #configImport: Promise<BunKnytConfig>;

  constructor(configImport: Promise<BunKnytConfig> = importConfigModule()) {
    this.#configImport = configImport;
  }

  /**
   * @detachable
   */
  readonly handleRequest: GlazierPluginOptions.OnRequest = async (request) => {
    const config = await this.#configImport;

    return config.onRequest?.(request);
  };

  /**
   * @detachable
   */
  readonly handleConfigureRender = async (
    inputPath: string,
  ): Promise<TransformerRenderOptions> => {
    const config = await this.#configImport;
    const renderOptions = await config.onConfigureRender?.(
      inputPath,
      config.render ?? {},
    );

    return {
      ...config.render,
      ...renderOptions,
    };
  };

  toOptions(): GlazierPluginOptions {
    return {
      onRequest: this.handleRequest,
      onConfigureRender: this.handleConfigureRender,
    };
  }
}

/**
 * Retrieves options from the Bun-Knyt config file.
 */
export function loadConfig(): GlazierPluginOptions {
  return new ConfigLoader().toOptions();
}
