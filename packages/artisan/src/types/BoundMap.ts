/**
 * A strict map type that enforces keys and values
 * based on a given generic (`T`).
 *
 * @public
 */
export type BoundMap<T> = {
  has<K extends keyof T>(key: K): boolean;
  get<K extends keyof T>(key: K): T[K] | undefined;
  set<K extends keyof T>(key: K, value: T[K]): BoundMap<T>;
  delete<K extends keyof T>(key: K): boolean;
  clear(): void;
  forEach(
    callback: <K extends keyof T>(
      value: T[K],
      key: K,
      map: BoundMap<T>,
    ) => void,
  ): void;
  [Symbol.iterator](): MapIterator<T>;
};

export namespace BoundMap {
  export type Readonly<T> = Omit<BoundMap<T>, "set" | "delete" | "clear">;
}
