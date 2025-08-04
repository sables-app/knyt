import { existsSync as fsExistsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import util, { type ParseArgsConfig } from "node:util";

import { cancel, intro, isCancel, log, select, text } from "@clack/prompts";
import {
  name as PACKAGE_NAME,
  version as PACKAGE_VERSION,
} from "create-knyt/package.json";
import { dim, red } from "picocolors";

import {
  availableProjectKinds,
  availableScaffoldingOptions,
  DEFAULT_TARGET_PATH,
  FlagOptionName,
  OptionName,
  ProjectKind,
  projectKindsWithMdxSupport,
  StringOptionName,
} from "./constants";
import {
  renderCompleteMessage,
  renderHelp,
  renderInteractiveIntro,
  renderOperationCancelled,
  translate as t,
} from "./lexicon";

type ParseArgsOptionConfig = NonNullable<ParseArgsConfig["options"]>[string];

type Options = {
  isInteractive: boolean;
  targetDir: string | undefined;
  kind: string | undefined;
  mdx: boolean | undefined;
  force: boolean | undefined;
  help: boolean | undefined;
  version: boolean | undefined;
  dryRun: boolean | undefined;
};

type ParsedOptionName = FlagOptionName | StringOptionName;

type ParsedOptionValues = Record<
  ParsedOptionName,
  Omit<
    ParseArgsOptionConfig,
    // "default" is not allowed, because we use the absence of options
    // to determine if the user is in non-interactive mode
    "default"
  >
>;

const argParsingOptions = {
  [OptionName.Kind]: {
    type: "string",
  },
  [OptionName.Mdx]: {
    type: "boolean",
  },
  [OptionName.Force]: {
    type: "boolean",
  },
  [OptionName.Help]: {
    type: "boolean",
  },
  [OptionName.Version]: {
    type: "boolean",
  },
  [OptionName.DryRun]: {
    type: "boolean",
  },
} as const satisfies ParsedOptionValues;

export async function runCli() {
  const options = getOptions();

  if (options.help) {
    console.info(renderHelp());
    process.exit(0);
  }
  if (options.version) {
    console.info(`${PACKAGE_NAME} ${PACKAGE_VERSION}`);
    process.exit(0);
  }

  const finalOptions = options.isInteractive
    ? await runInteractiveCli(options)
    : options;

  try {
    await scaffoldProject(finalOptions);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      log.error(`${red("✖")} ${error.message}`);
      process.exit(1);
    }

    throw error;
  }
}

function isProjectKind(value: string): value is ProjectKind {
  return availableProjectKinds.includes(value as ProjectKind);
}

function assertProjectKind(
  projectKind: string,
): asserts projectKind is ProjectKind {
  if (!isProjectKind(projectKind)) {
    throw new Error(t("invalid.project_kind", { projectKind }));
  }
}

function assertTargetDir(targetDir: string, force: boolean | undefined) {
  if (fsExistsSync(targetDir) && !force) {
    throw new Error(t("invalid.target_dir_exists", { targetDir }));
  }
}

function getOptions(): Options {
  const args = process.argv.slice(2);
  const { values, positionals } = util.parseArgs({
    args,
    options: argParsingOptions,
    strict: true,
    allowPositionals: true,
  });
  const targetPath = positionals.at(0);
  const targetDir = targetPath ? absolutePath(targetPath) : undefined;
  const isInteractive = availableScaffoldingOptions.every(
    (optionName) => values[optionName] === undefined,
  );

  if (values.kind !== undefined) {
    assertProjectKind(values.kind);
  }
  if (targetDir !== undefined) {
    assertTargetDir(targetDir, values.force);
  }

  return {
    isInteractive,
    targetDir,
    ...values,
  };
}

function isValidTargetDir(value: unknown): boolean {
  return typeof value == "string" && value.trim().length > 0;
}

/**
 * Wait for a prompt result and check if it was cancelled.
 * If it was cancelled, show a message and exit the process.
 * Otherwise, return the result.
 */
async function catchCancel<T>(promptResult$: Promise<T | symbol>): Promise<T> {
  const promptResult = await promptResult$;

  if (!isCancel(promptResult)) {
    return promptResult;
  }

  cancel(renderOperationCancelled());
  process.exit(0);
}

function isMdxSupported(projectKind: string | undefined): boolean {
  return (
    !!projectKind &&
    projectKindsWithMdxSupport.includes(projectKind as ProjectKind)
  );
}

async function runInteractiveCli(options: Options): Promise<Options> {
  const nextOptions = { ...options };

  intro(renderInteractiveIntro());

  if (options.targetDir === undefined) {
    const value = await catchCancel(
      text({
        message: t("label.target_dir"),
        placeholder: t("placeholder.target_dir"),
        validate: validateTargetDir,
      }),
    );

    nextOptions.targetDir = value.trim();
  }

  if (options.kind === undefined) {
    nextOptions.kind = await catchCancel(
      select({
        message: t("label.project_kind_select"),
        options: [
          {
            value: ProjectKind.Fullstack,
            label: t("label.fullstack"),
            hint: t("hint.fullstack"),
          },
          {
            value: ProjectKind.StaticSite,
            label: t("label.static_site"),
            hint: t("hint.static_site"),
          },
          {
            value: ProjectKind.SinglePage,
            label: t("label.single_page"),
            hint: t("hint.single_page"),
          },
          {
            value: ProjectKind.Components,
            label: t("label.components"),
            hint: t("hint.components"),
          },
        ],
      }),
    );
  }

  if (options.mdx === undefined && isMdxSupported(nextOptions.kind)) {
    nextOptions.mdx = await catchCancel(
      select({
        message: t("label.mdx"),
        initialValue: true,
        options: [
          {
            value: true,
            label: t("mdx.yes.label"),
            hint: t("mdx.yes.hint"),
          },
          {
            value: false,
            label: t("mdx.no.label"),
          },
        ],
      }),
    );
  }

  return nextOptions;
}

function getFallbackTargetDir(): string {
  return absolutePath(DEFAULT_TARGET_PATH);
}

function validateTargetDir(value: unknown): string | undefined {
  return isValidTargetDir(value) ? undefined : t("invalid.target_dir");
}

function absolutePath(value: string): string {
  return path.resolve(process.cwd(), value);
}

function relativePath(value: string): string {
  return path.relative(process.cwd(), value);
}

async function scaffoldProject(options: Options): Promise<void> {
  const kind = options.kind ?? ProjectKind.Fullstack;
  const targetDir = options.targetDir ?? getFallbackTargetDir();
  const force = options.force ?? false;
  const relativeTargetDir = relativePath(targetDir);
  const mdx = options.mdx ?? false;
  const dryRun = options.dryRun ?? false;

  assertProjectKind(kind);

  if (dryRun) {
    log.info(dim("Dry run mode enabled. No files will be written."));
  }

  log.step(t("scaffold.intro", { relativeTargetDir }));

  assertTargetDir(targetDir, force);

  if (!dryRun) {
    await fs.mkdir(targetDir, { recursive: true });
  }

  const patchOptions = { kind, targetDir, force, dryRun };

  await copyBoilerplate(patchOptions);

  if (mdx && isMdxSupported(kind)) {
    await patchMdxSupport(patchOptions);
  }

  log.success(t("scaffold.outro"));

  console.info(renderCompleteMessage({ kind, relativeTargetDir }));
}

type PatchOptions = {
  kind: ProjectKind;
  targetDir: string;
  force: boolean;
  dryRun: boolean;
};

async function copyFiles({
  sourceDir,
  targetDir,
  force,
  dryRun,
}: {
  sourceDir: string;
  targetDir: string;
  force: boolean;
  dryRun: boolean;
}): Promise<void> {
  if (!fsExistsSync(sourceDir)) {
    throw new Error(`Source directory "${sourceDir}" not found.`);
  }

  if (dryRun) {
    const sourceDisplayPath = path.basename(path.dirname(sourceDir));

    log.step(
      dim(
        `Dry run: Copying files from "${sourceDisplayPath}" to "${relativePath(targetDir)}"`,
      ),
    );
    return;
  }

  await fs.cp(sourceDir, targetDir, {
    recursive: true,
    force,
    errorOnExist: false,
  });
}

const BOILERPLATE_DIR = path.resolve(__dirname, "../boilerplate");

async function copyBoilerplate({
  kind,
  targetDir,
  force,
  dryRun,
}: PatchOptions): Promise<void> {
  const filesDir = path.resolve(BOILERPLATE_DIR, kind, "files");

  await copyFiles({
    sourceDir: filesDir,
    targetDir,
    force,
    dryRun,
  });
}

async function patchMdxSupport({
  kind,
  targetDir,
  dryRun,
}: PatchOptions): Promise<void> {
  const patchDir = path.resolve(BOILERPLATE_DIR, `${kind}__mdx__patch`);
  const filesDir = path.resolve(patchDir, "files");

  if (fsExistsSync(filesDir)) {
    await copyFiles({
      sourceDir: filesDir,
      targetDir,
      // Always overwrite the files, because this is a patch operation.
      force: true,
      dryRun,
    });
  }

  const filesPatchFilepath = path.resolve(patchDir, "files.patch.json");

  if (fsExistsSync(filesPatchFilepath)) {
    await patchFiles({
      patchFilePath: filesPatchFilepath,
      targetDir,
      dryRun,
    });
  }

  const packageJsonPatchFilepath = path.resolve(patchDir, "package.patch.json");

  if (fsExistsSync(packageJsonPatchFilepath)) {
    await patchPackageJson({
      patchFilePath: packageJsonPatchFilepath,
      targetDir,
      dryRun,
    });
  }

  const readmePatchFilepath = path.resolve(patchDir, "README.patch.md");

  if (fsExistsSync(readmePatchFilepath)) {
    await patchReadme({
      patchFilePath: readmePatchFilepath,
      targetDir,
      dryRun,
    });
  }
}

type FileOperationAction = "delete";

type FileOperation = {
  action: FileOperationAction;
  path: string;
};

const validOperationActions = [
  "delete",
] as const satisfies FileOperationAction[];

function isFileOperationAction(value: unknown): value is FileOperationAction {
  return (
    typeof value === "string" &&
    validOperationActions.includes(value as FileOperationAction)
  );
}

function isFileOperation(value: unknown): value is FileOperation {
  return (
    typeof value === "object" &&
    value !== null &&
    "action" in value &&
    isFileOperationAction(value.action) &&
    "path" in value &&
    typeof value.path === "string"
  );
}

function isFileOperations(value: unknown): value is FileOperation[] {
  return Array.isArray(value) && value.every((item) => isFileOperation(item));
}

async function patchFiles({
  patchFilePath,
  targetDir,
  dryRun,
}: {
  patchFilePath: string;
  targetDir: string;
  dryRun: boolean;
}): Promise<void> {
  const operations = JSON.parse(await fs.readFile(patchFilePath, "utf-8"));

  if (!isFileOperations(operations)) {
    throw new Error(`Invalid patch file format: ${patchFilePath}`);
  }

  for (const operation of operations) {
    const { action, path: relativeFilePath } = operation;
    const filePath = path.resolve(targetDir, relativeFilePath);

    if (action === "delete") {
      if (dryRun) {
        log.step(
          dim(
            `Dry run: Deleting file "${relativeFilePath}" from "${targetDir}"`,
          ),
        );
      } else if (fsExistsSync(filePath)) {
        await fs.unlink(filePath);
      }
    }
  }
}

async function patchPackageJson({
  patchFilePath,
  targetDir,
  dryRun,
}: {
  patchFilePath: string;
  targetDir: string;
  dryRun: boolean;
}): Promise<void> {
  if (dryRun) {
    log.step(dim("Dry run: Patched package.json"));
    return;
  }

  const packageJsonPatch = JSON.parse(
    await fs.readFile(patchFilePath, "utf-8"),
  );

  const packageJsonPath = path.resolve(targetDir, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

  Object.assign(packageJson, packageJsonPatch);

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), {
    encoding: "utf-8",
  });
}

async function patchReadme({
  patchFilePath,
  targetDir,
  dryRun,
}: {
  patchFilePath: string;
  targetDir: string;
  dryRun: boolean;
}): Promise<void> {
  if (dryRun) {
    log.step(dim("Dry run: Patched README.md"));
    return;
  }

  const readmePatch = await fs.readFile(patchFilePath, "utf-8");
  const readmePath = path.resolve(targetDir, "README.md");
  const readme = await fs.readFile(readmePath, "utf-8");
  const patchedReadme = `${readme}\n\n${readmePatch}`;

  await fs.writeFile(readmePath, patchedReadme, { encoding: "utf-8" });
}
