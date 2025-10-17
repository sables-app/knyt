import path from "node:path";

import { ensureReference, type Reference } from "@knyt/artisan";
import type { Loader, OnResolveResult, PluginBuilder } from "bun";

import { getTempDir } from "./getTempDir";
import type { GlazierPluginOptions } from "./transform/mod";

const VIRTUAL_PATH_ROOT = "virtual-knyt-bun";

type VirtualPath = `${typeof VIRTUAL_PATH_ROOT}/${string}/${string}.${Loader}`;

namespace VirtualPath {
  export type FromLoader = `/${VirtualPath}`;
  export type Parsed = {
    managerId: string;
    moduleId: string;
    loader: Loader;
  };
}

export type VirtualModule = {
  /**
   * The unique ID of the virtual module.
   * This is used to identify the module in the system.
   */
  id: string;
  /**
   * The contents of the virtual module.
   * This is the content that will be returned when the module is loaded.
   */
  contents: string;
  /**
   * The hash of the contents of the virtual module.
   * This is used to identify the module in the system.
   */
  hash: string;
  /**
   * The loader to use for this module.
   * This is also used as the file extension in the virtual path.
   */
  loader: Loader;
  /**
   * The virtual path of the module.
   * This is used to identify the module in module resolution.
   */
  virtualPath: VirtualPath;
  /**
   * An absolute file path of the module in the temp directory.
   * This is used to store the module in the file system.
   */
  /*
   * ### Private Remarks
   *
   * This is currently only used in the file system mode.
   */
  cachePath: string;
};

enum Mode {
  Memory = "Memory",
  // Bun's development static server is still in development and
  // sometimes doesn't work as expected. So we have an alternative
  // implementation that uses the file system, that can be used
  // if bugs are encountered.
  //
  // Additionally, the memory mode doesn't work with Bun's static server
  // when it's run from the CLI (`bun index.html`). So the file system
  // mode would be used in that case. However, we're more likely to just
  // write our own CLI tool to work with the existing plugin rather than
  // write another variant of the plugin for that use case.
  //
  // TODO: Remove this when Bun's development static server is stable.
  FileSystem = "FileSystem",
}

// Although Bun's development static server is still in development
// and sometimes doesn't work as expected, we still use the memory
// mode by default. This is because the file system mode is slower,
// require more resources, and requires cleaning up the temp directory
// after each run.
const DEFAULT_MODE = Mode.Memory;

export class VirtualModuleManager {
  /**
   * Promise resolving to a temp directory path for storing
   * virtual modules. Uses a stable salt so the same directory
   * is reused across multiple runs.
   */
  readonly #tempDir = getTempDir("virtual-modules");
  /**
   * A unique ID for this instance of the VirtualModuleManager.
   * This is used to create a unique path prefix for in-memory
   * virtual modules, to avoid conflicts with other instances.
   *
   * Unlike the temp directory, this ID is not stable across
   * multiple runs.
   */
  readonly #managerId = Math.random().toString(36).slice(2);
  /**
   * The path prefix for in-memory virtual modules.
   * This is used to identify virtual modules created by
   * this instance of the VirtualModuleManager.
   */
  readonly #pathPrefix = `${VIRTUAL_PATH_ROOT}/${this.#managerId}` as const;
  /**
   * A map of virtual modules created by this instance.
   */
  readonly #modules = new Map<VirtualPath, VirtualModule>();

  get #debug() {
    return this.#options$.value?.debug ?? false;
  }

  get #mode() {
    return this.#options$.value?.mode ?? DEFAULT_MODE;
  }

  #log(...args: any[]): void {
    if (this.#debug) {
      console.debug(...args);
    }
  }

  readonly #options$: Reference.Readonly<VirtualModuleManager.Options | null>;

  constructor(options: Reference.Maybe<VirtualModuleManager.Options>) {
    this.#options$ = ensureReference(options);
  }

  #hashContents(contents: string): string {
    return new Bun.CryptoHasher("md5").update(contents).digest("hex");
  }

  #findDuplicateModule(
    hash: string,
    loader: Loader,
  ): VirtualModule | undefined {
    for (const virtualModule of this.#modules.values()) {
      if (virtualModule.hash === hash && virtualModule.loader === loader) {
        return virtualModule;
      }
    }
  }

  /**
   * Creates a virtual module with the given contents and file extension.
   */
  async addModule(contents: string, loader: Loader): Promise<VirtualModule> {
    const hash = this.#hashContents(contents);

    const existingModule = this.#findDuplicateModule(hash, loader);

    if (existingModule) {
      this.#log(
        `[Glazier] Reusing existing virtual module: ${existingModule.virtualPath}`,
      );

      return existingModule;
    }

    const id = Math.random().toString(36).slice(2);
    const virtualPath = this.#createVirtualPath(id, loader);
    const cachePath = await this.#createCachePath(hash, loader);

    const virtualModule: VirtualModule = {
      id,
      contents,
      hash,
      virtualPath,
      loader,
      cachePath,
    };

    this.#modules.set(virtualPath, virtualModule);

    return virtualModule;
  }

  async ensureVirtualModuleCache(virtualModule: VirtualModule): Promise<void> {
    const cachedModule = Bun.file(virtualModule.cachePath);

    this.#log(
      `[Glazier] Ensuring virtual module cache: ${virtualModule.cachePath}`,
    );

    if (!(await cachedModule.exists())) {
      await cachedModule.write(virtualModule.contents);
    }
  }

  connect(builder: PluginBuilder): void {
    if (this.#mode === Mode.Memory) {
      this.connectInMemoryMode(builder);
    }
    if (this.#mode === Mode.FileSystem) {
      this.connectInFileSystemMode(builder);
    }
  }

  connectInFileSystemMode(builder: PluginBuilder): void {
    this.#tempDir
      .then((dir) => {
        this.#log(`[Glazier] VirtualModuleManager temp dir: ${dir}`);
      })
      .catch((err) => {
        console.error("[Glazier] Error getting temp dir:", err);
      });

    builder.onResolve(
      { filter: new RegExp(`^${this.#pathPrefix}`) },
      async ({ path }): Promise<OnResolveResult | null> => {
        this.#log(`[Glazier] Resolving virtual module path: ${path}`);

        const virtualModule = this.getModuleByPath(path);

        if (!virtualModule) {
          throw new Error(
            `Virtual module not found for path: ${path}`,
          );
        }

        await this.ensureVirtualModuleCache(virtualModule);

        return {
          path: virtualModule.cachePath,
          external: false,
        };
      },
    );
  }

  connectInMemoryMode(builder: PluginBuilder): void {
    this.#log(
      `[Glazier] VirtualModuleManager connected with path prefix: ${this.#pathPrefix}`,
    );

    builder.onResolve(
      { filter: new RegExp(`^${this.#pathPrefix}`) },
      async ({ path }): Promise<OnResolveResult | null> => {
        this.#log(`[Glazier] Resolving virtual module path: ${path}`);

        return { path: `/${path}`, external: false };
      },
    );

    builder.onLoad(
      { filter: new RegExp(`^/${this.#pathPrefix}`) },
      async ({
        path,
        // Renamed to avoid conflict TypeScript keyword
        namespace: moduleNamespace,
        defer
      }) => {
        if (path.endsWith(".html")) {
          return null as any;
        }

        this.#log(
          `[Glazier] Loading virtual module path: ${path} in namespace: ${moduleNamespace}`,
        );

        await defer();

        const virtualModule = this.getModuleByPath(path);

        if (!virtualModule) {
          throw new Error(
            `Virtual module not found for path: ${path} in namespace: ${moduleNamespace}`,
          );
        }

        this.#log(virtualModule);

        return {
          contents: virtualModule.contents,
          loader: virtualModule.loader,
        };
      },
    );
  }

  getModuleByPath(path: string): VirtualModule | undefined {
    const parsedPath = parsePath(path);
    const { moduleId, loader } = parsedPath;

    return this.getModuleById(moduleId, loader);
  }

  getModuleById(moduleId: string, loader: Loader): VirtualModule | undefined {
    return this.#modules.get(this.#createVirtualPath(moduleId, loader));
  }

  #createVirtualPath(moduleId: string, loader: Loader): VirtualPath {
    return `${this.#pathPrefix}/${moduleId}.${loader}`;
  }

  async #createCachePath(hash: string, loader: Loader): Promise<string> {
    return path.resolve(await this.#tempDir, `${hash}.${loader}`);
  }
}

export namespace VirtualModuleManager {
  export type Options = GlazierPluginOptions.Mutable & {
    mode?: Mode;
  };
}

function parsePath(path: string): VirtualPath.Parsed {
  const virtualPath = path.startsWith("/") ? path.slice(1) : path;
  const [front, loader] = virtualPath.split(".");
  const [_root, managerId, moduleId] = front.split("/");

  if (!managerId || !moduleId || !loader) {
    throw new Error(`Invalid virtual module path: ${path}`);
  }

  return {
    managerId,
    moduleId,
    loader: loader as Loader,
  };
}
