import { Beacon } from "@knyt/artisan";

/**
 * An event emitted when a dependency changes.
 *
 * @internal scope: package
 */
export type DependencyChange = {
  /**
   * Absolute path to the entrypoint file that imports the
   * dependency which changed in its dependency graph.
   */
  entrypointPath: string;
  /**
   * Either an absolute path or a module path
   * to the dependency that changed.
   */
  dependencyModulePath: string;
};

/**
 * Emits events when dependencies change, without maintaining state.
 *
 * @remarks
 *
 * Used to notify the system of dependency changes.
 * This beacon is a low-level API, similar to `fs.watch`, and should only
 * emit events. It must not respond to events or maintain state.
 * If there are no listeners, it should remain inactive.
 *
 * @internal scope: package
 */
export const dependencyChanges = Beacon.withEmitter<DependencyChange>();
