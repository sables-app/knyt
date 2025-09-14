import {
  createReference,
  MiddlewareRunner,
  type Reference,
  type Subscription,
} from "@knyt/artisan";
import type { BunPlugin, PluginBuilder } from "bun";

import { loadConfig } from "./ConfigLoader";
import { DependencyManager } from "./DependencyManager";
import { setupHmrTransform } from "./HmrTransform/mod";
import { setupHtmlTransform } from "./setupHtmlTransform";
import { setupImportBlocklist } from "./setupImportBlocklist";
import { type GlazierPluginOptions } from "./transform/mod";
import type {
  BunKnytConfig,
  MiddlewareConfig,
  TransformerRenderOptions,
} from "./types";

export namespace Middleware {
  export enum Kind {
    Request = "request",
    ConfigureRender = "configureRender",
  }

  export type ByKind = {
    [Kind.Request]: BunKnytConfig.OnRequest;
    [Kind.ConfigureRender]: BunKnytConfig.OnConfigureRender;
  };
}

export class GlazierPlugin implements BunPlugin {
  /**
   * Creates a new plugin instance with options loaded from the
   * Bun-Knyt config file.
   */
  static withConfigFile(options?: GlazierPluginOptions): GlazierPlugin {
    return new GlazierPlugin({ ...loadConfig(), ...options });
  }

  get name() {
    return "knyt.glazier";
  }

  #middleware = new MiddlewareRunner<Middleware.ByKind>();

  readonly #mutableOptions$: Reference<GlazierPluginOptions.Mutable>;

  get cacheId() {
    return this.#mutableOptions$.value.cacheId ?? "default";
  }

  set cacheId(value: string) {
    this.#mutableOptions$.set({
      ...this.#mutableOptions$.value,
      cacheId: value,
    });
  }

  get debug() {
    return this.#mutableOptions$.value.debug ?? false;
  }

  set debug(value: boolean) {
    this.#mutableOptions$.set({
      ...this.#mutableOptions$.value,
      debug: value,
    });
  }

  constructor({
    onRequest,
    onConfigureRender,
    ...mutableOptions
  }: GlazierPluginOptions = {}) {
    this.#mutableOptions$ = createReference(mutableOptions);

    if (onRequest) {
      this.onRequest(onRequest);
    }
    if (onConfigureRender) {
      this.onConfigureRender(onConfigureRender);
    }

    // !!! Important !!!
    //
    // The plugin shouldn't perform any work in the constructor,
    // because an instance of the plugin is created upon importing
    // the `./plugin` module. This is a requirement to integrate
    // the plugin into Bun's static server; the plugin must be
    // exposed as a default export.
    //
    // In the future, if the plugin _must_ perform work in the
    // constructor, then the `./plugin` module should be removed,
    // and consumers will be required to import and configure
    // the plugin manually in their own module.
  }

  /**
   * Add middleware for handling requests.
   */
  onRequest(middleware: BunKnytConfig.OnRequest): Subscription {
    this.#middleware.add(Middleware.Kind.Request, middleware);

    return {
      unsubscribe: () => {
        this.#middleware.remove(Middleware.Kind.Request, middleware);
      },
    };
  }

  /**
   * Add middleware for configuring render options.
   */
  onConfigureRender(middleware: BunKnytConfig.OnConfigureRender): Subscription {
    this.#middleware.add(Middleware.Kind.ConfigureRender, middleware);

    return {
      unsubscribe: () => {
        this.#middleware.remove(Middleware.Kind.Request, middleware);
      },
    };
  }

  /*
   * ### Private Remarks
   *
   * This is public to allow for use in other contexts. For example, when
   * there's a desire to reuse the same configuration for both the static
   * server and dynamic routes.
   */
  readonly middleware: MiddlewareConfig = {
    onRequest: async (request) => {
      return this.#middleware.chain(Middleware.Kind.Request, request);
    },
    onConfigureRender: async (inputPath) => {
      let result: TransformerRenderOptions = {};

      this.#middleware.forEach(
        Middleware.Kind.ConfigureRender,
        async (middleware) => {
          result = (await middleware(inputPath, result)) ?? result;
        },
      );

      return result;
    },
  };

  /**
   * TODO: Remove in v1 release.
   * @deprecated Use `middleware` instead.
   */
  get options(): MiddlewareConfig {
    return this.middleware;
  }

  #dependencyManager: DependencyManager | undefined;

  get dependencyManager() {
    if (!this.#dependencyManager) {
      this.#dependencyManager = new DependencyManager(this.#mutableOptions$);
    }

    return this.#dependencyManager;
  }

  /**
   * @detachable
   */
  readonly setup = async (builder: PluginBuilder) => {
    const dependencyManager = this.dependencyManager;

    dependencyManager.connect(builder);

    // There are some things we just can't do yet, because Bun doesn't
    // support the required APIs. For example, we can't use the `onEnd`
    // hook to get metadata about the build.
    // See: https://github.com/oven-sh/bun/issues/2771
    // builder.onEnd(console.debug);

    setupImportBlocklist(builder);
    setupHtmlTransform(builder, dependencyManager, this.middleware);
    setupHmrTransform(builder);
  };
}
