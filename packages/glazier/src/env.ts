import path from "node:path";

enum EnvVarName {
  /**
   * The environment variable that indicates if the process is running in a CI environment.
   *
   * @remarks
   *
   * This is typically set by CI providers like GitHub Actions, Travis CI, etc.
   */
  CI = "CI",
  /**
   * The environment variable that specifies the path to the Knyt configuration file.
   *
   * @defaultValue "knyt.config.ts"
   */
  KnytConfigPath = "KNYT_CONFIG_PATH",
  /**
   * The environment variable that specifies the batch size for Knyt.
   *
   * @defaultValue "4"
   */
  KnytBatchSize = "KNYT_BATCH_SIZE",
  /**
   * The environment variable that specifies the verbosity of the output.
   *
   * @defaultValue "false"
   *
   * @remarks
   *
   * This is a standard environment variable used to control the level of detail in logs.
   * If set to "true", the application will log more detailed information.
   * If set to "false", it will log only essential information.
   * This can be useful for debugging or monitoring the application.
   */
  Verbose = "VERBOSE",
  /**
   * The environment variable that specifies the home directory.
   *
   * @remarks
   *
   * This is typically set by the operating system and can be used to locate user-specific configuration files.
   */
  Home = "HOME",
  /**
   * The environment variable that specifies the XDG config home directory.
   *
   * @remarks
   *
   * This is typically used in Linux environments to specify where user-specific configuration files are stored.
   */
  XDGConfigHome = "XDG_CONFIG_HOME",
}

/**
 * Known application environments.
 *
 * @internal scope: package
 */
enum KnownEnvironments {
  Development = "development",
  Production = "production",
  Test = "test",
}

const DEFAULT_CONFIG_NAME = "knyt.config.ts";

export function getConfigModulePath() {
  const pathFromEnv = import.meta.env[EnvVarName.KnytConfigPath];

  if (pathFromEnv) {
    return path.isAbsolute(pathFromEnv)
      ? pathFromEnv
      : path.resolve(process.cwd(), pathFromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_CONFIG_NAME);
}

/**
 * Get the current application mode.
 *
 * @remarks
 *
 * This should be used within the context of SSR.
 * This function ensures consistency between different
 * parts of the transformation and rendering process.
 *
 * In other contexts, consider using `import.meta.env.NODE_ENV` directly.
 *
 * @internal scope: package
 */
export function getSSREnv(): string {
  return import.meta.env.NODE_ENV ?? KnownEnvironments.Development;
}

/**
 * Determine if the current environment is development.
 *
 * @remarks
 *
 * This function should be used within the context of SSR.
 * This function ensures consistency between different
 * parts of the transformation and rendering process.
 *
 * In other contexts, consider using `import.meta.env.NODE_ENV` directly.
 *
 * @internal scope: package
 */
export function isProductionSSREnv(): boolean {
  return getSSREnv() === KnownEnvironments.Production;
}

export function getBooleanEnvVar(
  name: string,
  defaultValue = "false",
): boolean {
  return Boolean(JSON.parse(import.meta.env[name] || defaultValue));
}

export function isCIEnv(): boolean {
  return getBooleanEnvVar(EnvVarName.CI);
}

export function isVerboseEnv(): boolean {
  return getBooleanEnvVar(EnvVarName.Verbose);
}

export function getHomeDir() {
  return import.meta.env[EnvVarName.Home] ?? process.cwd();
}

export function getXDGConfigHome() {
  return (
    import.meta.env[EnvVarName.XDGConfigHome] ??
    path.join(getHomeDir(), ".config")
  );
}

export function getKnytBatchSize() {
  const value = import.meta.env[EnvVarName.KnytBatchSize];
  const knytBatchSize = value ? parseInt(value, 10) : 4;

  if (isNaN(knytBatchSize) || knytBatchSize <= 0) {
    throw new Error(
      `Invalid ${EnvVarName.KnytBatchSize} environment variable: ${value}. It must be a positive integer.`,
    );
  }

  return knytBatchSize;
}
