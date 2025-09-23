import { watch } from "node:fs/promises";

import { Beacon, typeCheck, type Observer } from "@knyt/artisan";

import { getOptimalWatchPoints } from "./getOptimalWatchPoints";

/**
 * A beacon that emits events when files change.
 *
 * @remarks
 *
 * This wraps the native `fs.watch` API in Bun, providing an interface for
 * watching changes to multiple files that may not exist within the same directory,
 * while also providing a more ergonomic interface with the use of observables.
 */
export class FilesWatcher
  extends Beacon<string>
  implements Observer<Iterable<string>>
{
  #abortController?: AbortController;
  #persistent: boolean;
  #emitter: Beacon.Emitter<string>;

  constructor(
    modulePaths?: Iterable<string>,
    options?: {
      /**
       * Indicates whether the process should continue running
       * as long as files are being watched.
       *
       * @defaultValue `false`
       */
      persistent?: boolean;
    },
  ) {
    let emitter: Beacon.Emitter<string>;

    super((_emitter) => {
      // `super()` must complete before we can assign to `this.#emitter`.
      emitter = _emitter;
    });

    this.#emitter = emitter!;
    this.#persistent = options?.persistent ?? false;

    if (modulePaths) {
      this.next(modulePaths);
    }
  }

  /**
   * Stops all active file watchers.
   *
   * @remarks
   *
   * This method is idempotent and can be called multiple times safely. Once called,
   * all active watchers will be stopped and no further events will be emitted,
   * until `next()` is called again with new module paths.
   */
  #stopWatching(): void {
    this.#abortController?.abort();
    this.#abortController = undefined;
  }

  /**
   * Cleans up resources used by the watcher.
   *
   * @remarks
   *
   * This method is idempotent and can be called multiple times safely.
   * Once called, the watcher will stop emitting events.
   */
  complete(): void {
    this.#stopWatching();

    if (!this.#emitter.hasTerminated) {
      this.#emitter.complete();
    }
  }

  error(error: unknown): void {
    this.#stopWatching();

    if (!this.#emitter.hasTerminated) {
      this.#emitter.error(error);
    }
  }

  next(modulePaths: Iterable<string>): void {
    this.#stopWatching();

    this.#abortController = new AbortController();

    const cwd = process.cwd();
    const signal = this.#abortController.signal;

    const resolvedPaths = Array.from(modulePaths).reduce<Set<string>>(
      (set, modulePath) => {
        try {
          // The document path may be a module path or an absolute path.
          // We need to resolve it to an absolute path.
          // Relative paths aren't supported, but we can resolve
          // them to the current working directory for a sane default.
          set.add(Bun.resolveSync(modulePath, cwd));
        } catch {
          console.warn(`Could not resolve path: ${modulePath}.`);
        }
        return set;
      },
      new Set(),
    );

    getOptimalWatchPoints(resolvedPaths).forEach(async (optimalPoint) => {
      try {
        // The leading slash is removed by getOptimalWatchPoints; add it back.
        const targetPath = `/${optimalPoint.path}`;

        const watcher = watch(targetPath, {
          signal,
          persistent: this.#persistent,
          recursive: false,
        });

        for await (const event of watcher) {
          if (optimalPoint.type === "file") {
            // If we're watching a file, we know it changed.
            this.#emitter.next(optimalPoint.path);
            continue;
          }
          if (optimalPoint.type === "directory") {
            // If there's no filename, we cannot determine which file changed.
            if (event.filename == null) continue;

            const fullPath = `/${optimalPoint.path}/${event.filename}`;

            if (!resolvedPaths.has(fullPath)) continue;

            this.#emitter.next(fullPath);

            continue;
          }

          typeCheck<never>(typeCheck.identify(optimalPoint));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Watcher was aborted, exit silently.
          //
          // NOTE: The beacon should not be completed here, as a new
          // set of watchers may be started by calling `next()` again.
          return;
        }
        if (!this.#emitter.hasTerminated) {
          this.#emitter.error(error);
        } else {
          console.error("[FilesWatcher] Error after termination:", error);
        }
      }
    });
  }
}
