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

enum KnownEnvironments {
  Development = "development",
  Production = "production",
  Test = "test",
}

const DEFAULT_CONFIG_NAME = "knyt.config.ts";

export function getConfigModulePath() {
  const pathFromEnv = process.env[EnvVarName.KnytConfigPath];

  if (pathFromEnv) {
    return path.isAbsolute(pathFromEnv)
      ? pathFromEnv
      : path.resolve(process.cwd(), pathFromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_CONFIG_NAME);
}

export function getNodeEnv() {
  return process.env.NODE_ENV ?? KnownEnvironments.Development;
}

export function isProductionEnv() {
  return getNodeEnv() === KnownEnvironments.Production;
}

export function getBooleanEnvVar(
  name: string,
  defaultValue = "false",
): boolean {
  return Boolean(JSON.parse(process.env[name] || defaultValue));
}

export function isCIEnv(): boolean {
  return getBooleanEnvVar(EnvVarName.CI);
}

export function isVerboseEnv(): boolean {
  return getBooleanEnvVar(EnvVarName.Verbose);
}

export function getHomeDir() {
  return process.env[EnvVarName.Home] ?? process.cwd();
}

export function getXDGConfigHome() {
  return (
    process.env[EnvVarName.XDGConfigHome] ?? path.join(getHomeDir(), ".config")
  );
}

export function getKnytBatchSize() {
  const value = process.env[EnvVarName.KnytBatchSize];
  const knytBatchSize = value ? parseInt(value, 10) : 4;

  if (isNaN(knytBatchSize) || knytBatchSize <= 0) {
    throw new Error(
      `Invalid ${EnvVarName.KnytBatchSize} environment variable: ${value}. It must be a positive integer.`,
    );
  }

  return knytBatchSize;
}
