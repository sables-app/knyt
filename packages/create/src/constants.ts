/**
 * All available options for the CLI
 */
export enum OptionName {
  Kind = "kind",
  Mdx = "mdx",
  Force = "force",
  DryRun = "dryRun",
  Help = "help",
  Version = "version",
  TargetDir = "targetDir",
}

/**
 * All available boolean flags for the CLI
 */
export enum FlagOptionName {
  Mdx = OptionName.Mdx,
  Force = OptionName.Force,
  DryRun = OptionName.DryRun,
  Help = OptionName.Help,
  Version = OptionName.Version,
}

/**
 * All available scaffolding options for the CLI
 */
export enum ScaffoldingOptionName {
  Kind = OptionName.Kind,
  Mdx = OptionName.Mdx,
}

/**
 * All available strings options for the CLI
 */
export enum StringOptionName {
  Kind = OptionName.Kind,
}

/**
 * Kinds of projects that can be created.
 */
export enum ProjectKind {
  Fullstack = "fullstack",
  Components = "components",
  SinglePage = "single-page",
  StaticSite = "static-site",
}

/**
 * Project kinds that are available for scaffolding.
 */
export const availableProjectKinds = Object.values(ProjectKind);

/**
 * Scaffolding options that are available for the CLI.
 * This is a subset of all available options.
 */
export const availableScaffoldingOptions = Object.values(ScaffoldingOptionName);

/**
 * Project kinds that support MDX.
 */
export const projectKindsWithMdxSupport = [
  ProjectKind.Fullstack,
  ProjectKind.StaticSite,
];

/**
 * The fallback relative target path for the project.
 * This is used when the user does not provide a target path.
 */
export const DEFAULT_TARGET_PATH = "knyt-project";
