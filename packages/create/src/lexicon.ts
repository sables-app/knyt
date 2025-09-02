import { bold, cyan, dim, green, italic, red, underline } from "picocolors";

import {
  availableProjectKinds,
  DEFAULT_TARGET_PATH,
  FlagOptionName,
  OptionName,
  ProjectKind,
} from "./constants";

export function translate(
  key: keyof typeof Lexicon,
  values: Lexicon.Values = {},
): string {
  return Lexicon[key](values);
}

const Lexicon = {
  "placeholder.target_dir": () => DEFAULT_TARGET_PATH,
  "label.project_kind_select": () => "Pick a kind of project",
  "label.target_dir": () => "Target directory",
  operation_cancelled: () => "Operation cancelled",
  "invalid.project_kind": ({ projectKind }) =>
    `Invalid kind: ${projectKind}. Available kinds: ${availableProjectKinds.join(", ")}`,
  "invalid.target_dir": () => "Target directory must be a non-empty string.",
  "invalid.target_dir_exists": ({ targetDir }) =>
    `Target directory ${targetDir} already exists. Use --${FlagOptionName.Force} to force creation.`,
  "label.fullstack": () => "Fullstack Application",
  "hint.fullstack": () => "A fullstack application with server-side rendering",
  "label.static_site": () => "Static Site",
  "hint.static_site": () => "A static site generated at build time",
  "label.components": () => "Component Library",
  "hint.components": () =>
    "A component library for building reusable UI components",
  "label.mdx": () => "Add MDX support?",
  "mdx.yes.label": () => "Yes",
  "mdx.no.label": () => "No",
  "mdx.yes.hint": () =>
    "Essential MDX dependencies will be added and configured.",
  "scaffold.intro": ({ relativeTargetDir }) =>
    `Scaffolding project in "${relativeTargetDir}"...`,
  "scaffold.outro": () => "🐣 You're all set!",
  "label.single_page": () => "Single Page Application",
  "hint.single_page": () =>
    "A single page application with client-side rendering",
} as const satisfies Record<string, (values: Lexicon.Values) => string>;

namespace Lexicon {
  export type Values = Partial<Record<string, string>>;
}

export function renderHelp() {
  return `${brand(`
  _                _
 | | ___ __  _   _| |_
 | |/ / '_ \\| | | | __|
 |   <| | | | |_| | |_
 |_|\\_\\_| |_|\\__, |\\__|
             |___/
`)}
${bold("Usage:")}

  ${underline("create-knyt")} [<options>...] [<target-dir>]

${bold("Description:")}

  Create a new Knyt project.
  If no scaffolding options are provided, the CLI will start in interactive mode.

${bold("Basic options:")}
  ${brand(`--${FlagOptionName.Force}`)}
    Create the project even if the directory is not empty.
  ${brand(`--${FlagOptionName.DryRun}`)}
    Show what would be done without actually doing it.
  ${brand(`--${FlagOptionName.Help}`)}
    Display this help message.
  ${brand(`--${FlagOptionName.Version}`)}
    Display the version number of this CLI.

${bold("Scaffolding options:")}
  ${brand(`--${OptionName.Kind}`)}
    Create a project of the specified kind.
    ${dim(`Available kinds: ${availableProjectKinds.join(", ")}`)}
  ${brand(`--${FlagOptionName.Mdx}`)}
    Add MDX support.
    ${dim("Essential MDX dependencies will be added and configured.")}
    ${dim("Only works with kinds that support MDX.")}
`;
}

function renderGetStartedMessage(
  relativeTargetDir: string,
  packageManager: "bun" | "npm",
): string {
  // If the target directory is the same as the current directory,
  // then the value of `relativeTargetDir` will be an empty string,
  // so we will output a dot (.) to indicate the current directory.
  const targetDir = relativeTargetDir || ".";

  return `
${green("✔")} To get started, run:

  ${italic(brand(`cd ${targetDir}`))}
  ${italic(brand(`${packageManager} install`))}
  ${italic(brand(`${packageManager} run dev`))}
`;
}

function renderGitMessage(relativeTargetDir: string): string {
  return `
${green("✔")} Optional: Initialize Git in your project directory with:

  ${italic(brand(`git init && git add -A && git commit -m "chore: initial commit"`))}
`;
}

const packageManagerByProjectKind: Record<ProjectKind, "bun" | "npm"> = {
  [ProjectKind.Fullstack]: "bun",
  [ProjectKind.Components]: "bun",
  [ProjectKind.SinglePage]: "bun",
  [ProjectKind.StaticSite]: "bun",
};

export function renderCompleteMessage({
  kind,
  relativeTargetDir,
}: {
  kind: ProjectKind;
  relativeTargetDir: string;
}): string {
  const packageManager = packageManagerByProjectKind[kind];

  return [
    renderGetStartedMessage(relativeTargetDir, packageManager),
    renderGitMessage(relativeTargetDir),
  ].join("");
}

export function renderInteractiveIntro(): string {
  return `${brand(underline(bold("Knyt")))} ${dim("– A Modular Toolkit for the Modern Web")}`;
}

export function renderOperationCancelled(): string {
  return `${red("✖")} ${dim(translate("operation_cancelled"))}`;
}

function hexToAnsi(hex: string, isBackground = false) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `\x1b[${isBackground ? "48" : "38"};2;${r};${g};${b}m`;
}

function createCustomColor(hex: string, isBackground = false) {
  if (typeof process.env.NO_COLOR === "string") {
    return (text: string) => text;
  }

  const customColor = hexToAnsi(hex, isBackground);

  return (text: string) => `${customColor}${text}\x1b[0m`;
}

const shouldUseHexColors =
  process.stdout.isTTY && process.stdout.getColorDepth() > 8;

const brand = shouldUseHexColors ? createCustomColor("#91b7e6") : cyan;
