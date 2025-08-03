export class MiddlewareRunner<B> {
  #middlewareList: MiddlewareRunner.List<B> = [];

  [Symbol.iterator](): MiddlewareRunner.Iterator<B> {
    return this.#middlewareList.values();
  }

  get length(): number {
    return this.#middlewareList.length;
  }

  hasMiddleware(...targetEntry: MiddlewareRunner.Entry<B>): boolean {
    return this.#middlewareList.some((entry) => {
      const [kind, middleware] = entry;
      const [targetKind, targetMiddleware] = targetEntry;

      return kind === targetKind && middleware === targetMiddleware;
    });
  }

  addMiddleware(...entry: MiddlewareRunner.Entry<B>): void {
    if (this.hasMiddleware(...entry)) {
      const [kind, middleware] = entry;
      console.warn(`Middleware already exists: [${kind}, ${middleware.name}]`);
      return;
    }

    this.#middlewareList.push(entry);
  }

  removeMiddleware(...targetEntry: MiddlewareRunner.Entry<B>): void {
    const indexToRemove = this.#middlewareList.findIndex((entry) => {
      const [kind, middleware] = entry;
      const [targetKind, targetMiddleware] = targetEntry;

      return kind === targetKind && middleware === targetMiddleware;
    });

    if (indexToRemove !== -1) {
      this.#middlewareList.splice(indexToRemove, 1);
    }
  }

  async forEach<K extends MiddlewareRunner.Kind<B>>(
    targetKind: K,
    handler: (middleware: MiddlewareRunner.Middleware<B, K>) => Promise<void>,
  ): Promise<void> {
    // Copy middleware list to prevent issues from modifications during iteration.
    const list = [...this.#middlewareList];

    for (const entry of list) {
      const [kind, middleware] = entry;

      if (kind !== targetKind) continue;

      await handler(middleware as MiddlewareRunner.Middleware<B, K>);
    }
  }

  async chain<K extends MiddlewareRunner.Kind<B>>(
    targetKind: K,
    initialValue: MiddlewareRunner.ChainableMiddleware.Value<B, K>,
  ): Promise<MiddlewareRunner.ChainableMiddleware.Value<B, K>> {
    let result = initialValue;

    await this.forEach(targetKind, async (middleware) => {
      result = (await middleware(result)) ?? result;
    });

    return result;
  }
}

export namespace MiddlewareRunner {
  export type _ByKind = Record<string, (...args: any[]) => any>;

  export type Kind<B> = B extends _ByKind
    ? Exclude<keyof B, symbol | number>
    : never;

  export type Entry<B, K extends Kind<B> = Kind<B>> = B extends _ByKind
    ? [K, B[K]]
    : never;

  export type List<B> = Entry<B>[];

  export type Iterator<B> = ArrayIterator<Entry<B>>;

  export type Middleware<B, K extends Kind<B>> = B extends _ByKind
    ? B[K]
    : never;

  export type ChainableMiddleware<T> = (
    firstArg: T,
  ) => T | void | Promise<T | void>;

  export namespace ChainableMiddleware {
    export type Value<B, K extends Kind<B>> =
      MiddlewareRunner.Middleware<B, K> extends ChainableMiddleware<infer T>
        ? T
        : never;
  }
}
