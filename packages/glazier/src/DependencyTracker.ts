import type { Observer } from "@knyt/artisan";

import { dependencyChanges } from "./dependencyChanges.ts";
import { FilesWatcher } from "./FilesWatcher/mod.ts";
import type { TransformResult } from "./transform/mod.ts";

type ProcessedIncludePath = string;
type InputPath = string;

export class DependencyTracker implements Observer<ProcessedIncludePath> {
  #inputPathByIncludePath = new Map<ProcessedIncludePath, Set<InputPath>>();
  #watcher: FilesWatcher = new FilesWatcher();

  constructor() {
    this.#watcher.subscribe(this);
  }

  next(includePath: ProcessedIncludePath): void {
    const inputPaths = this.#inputPathByIncludePath.get(includePath);

    if (!inputPaths) {
      console.debug(
        `[DependencyTracker] No entrypoint found for tracked include: ${includePath}`,
      );

      // If for some reason a tracked include has no associated entrypoint, skip it.
      return;
    }

    console.debug(
      `[DependencyTracker] Detected change in dependency: ${includePath}`,
    );

    for (const inputPath of inputPaths) {
      dependencyChanges.next({
        entrypointPath: inputPath,
        dependencyModulePath: includePath,
      });
    }
  }

  track(transformResult: TransformResult): void {
    const { inputPath, includesProcessed } = transformResult;

    for (const includePath of includesProcessed) {
      const existingInputPaths = this.#inputPathByIncludePath.get(includePath);

      if (existingInputPaths) {
        existingInputPaths.add(inputPath);
        continue;
      }

      this.#inputPathByIncludePath.set(includePath, new Set([inputPath]));
    }

    const allIncludedPaths = this.#inputPathByIncludePath.keys();

    this.#watcher.next(allIncludedPaths);
  }
}
