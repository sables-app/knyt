/// <reference types="bun-types" />

import { watch } from "fs/promises";
import * as path from "node:path";

/**
 * @module stubPackageDist
 *
 * This script modifies the KnytElement module in the package's dist directory
 * by replacing all occurrences of `extends HTMLElement` with `extends __HTMLElement()`.
 * The purpose is to allow importing and using the KnytElement module in environments
 * where the native HTMLElement class may not be available (such as during testing or
 * in non-browser runtimes).
 *
 * The script also copies a stubs module (`__stubs.js`) into the dist directory.
 * The stub provides a fallback for HTMLElement: if `globalThis.HTMLElement` exists,
 * it is used; otherwise, attempting to instantiate the element will throw a runtime error.
 *
 * Usage:
 *   - Run this script after building the package to patch the output.
 *   - Use the `--watch` flag to enable file watching and automatically re-stub on changes.
 */

const DIST_DIR = path.resolve(__dirname, "../dist/build");

const modulesToStub = ["main.js", "KnytElement.js"];

const StubsFileSrc = Bun.file(path.resolve(__dirname, "__stubs.js"));
const StubsFileDist = Bun.file(path.resolve(DIST_DIR, "__stubs.js"));

function stubModuleContent(str: string): string {
  const stubImportStatement = `import { __HTMLElement } from "./__stubs";\n`;

  return (
    stubImportStatement +
    str.replace("extends HTMLElement", "extends __HTMLElement()")
  );
}

async function stubModule(filePath: string): Promise<void> {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    // File doesn't exist, skip stubbing
    return;
  }

  const fileContent = await file.text();

  if (!fileContent.includes("extends HTMLElement")) {
    // Either already stubbed, or doesn't need stubbing
    return;
  }

  await Bun.write(file, stubModuleContent(fileContent));
  console.info(`Stubbed module: ${filePath}`);
}

function getModulePaths() {
  return modulesToStub.map((moduleRelativePath) =>
    path.resolve(DIST_DIR, moduleRelativePath),
  );
}

async function stubModules() {
  console.info("Stubbing modules...");

  return Promise.all(getModulePaths().map(stubModule));
}

async function copyStubs() {
  console.info("Copying stubs module...");

  await Bun.write(StubsFileDist, StubsFileSrc);
}

async function stubPackageDist() {
  await Promise.all([await stubModules(), await copyStubs()]);

  console.info("Finished stubbing package dist.");
}

function startWatching() {
  const abortController = new AbortController();

  console.info("Watching for changes...");

  getModulePaths().forEach(async (filePath) => {
    try {
      const watcher = watch(filePath, {
        signal: abortController.signal,
        persistent: false,
      });

      let isSkipping = false;

      for await (const event of watcher) {
        if (isSkipping) continue;

        console.info(`Detected ${event.eventType} in ${event.filename}`);

        isSkipping = true;

        // Skip events for a time to avoid the watcher from responding to
        // events originating from itself. This is a workaround for the
        // issue where the watcher responds to its own changes, causing
        // an infinite loop.
        //
        // This is a temporary solution until we find a better way to
        // handle this; tbh, it's good enough, and I probably won't
        // change it, spend my time on something else. 🙃
        setTimeout(() => {
          isSkipping = false;
        }, 250);

        // Wait for the files to be fully written before stubbing it.
        await new Promise((resolve) => setTimeout(resolve, 100));

        await stubPackageDist();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Ignore abort errors
        return;
      }

      console.error(error);
    }
  });

  process.on("SIGINT", () => {
    console.info("Stopping watcher...");
    abortController.abort();
    process.exit(0);
  });
}

async function main() {
  const watchEnabled = process.argv.includes("--watch");

  await stubPackageDist();

  if (watchEnabled) {
    startWatching();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
