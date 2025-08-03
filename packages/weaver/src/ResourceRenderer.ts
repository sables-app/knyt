import { isNonNullableObject } from "@knyt/artisan";

import type { KnytContent } from "./types/mod";

/**
 * An object that can render a resource.
 *
 * @remarks
 *
 * A rendered resource is intended to be element that are not visible
 * to users, but are used by the element. Examples include `<script>`,
 * `<link>`, and `<style>` elements.
 *
 * @beta
 */
export type ResourceRenderer = {
  /**
   * A method called by the host to render the resource.
   */
  hostRender(): KnytContent | Promise<KnytContent>;
};

export type ResourceRendererHost = {
  /**
   * Adds a resource renderer to the element.
   *
   * @see {@link ResourceRenderer}
   */
  addRenderer(input: ResourceRenderer): void;

  /**
   * Removes a renderer from the element.
   */
  removeRenderer(input: ResourceRenderer): void;
};

/**
 * Determines whether the input is a {@link ResourceRendererHost}.
 *
 * @public
 */
export function isResourceRendererHost(
  input: unknown,
): input is ResourceRendererHost {
  return (
    isNonNullableObject(input) &&
    "addRenderer" in input &&
    typeof (input as ResourceRendererHost).addRenderer === "function" &&
    "removeRenderer" in input &&
    typeof (input as ResourceRendererHost).removeRenderer === "function"
  );
}

export class BasicResourceRendererHost implements ResourceRendererHost {
  /**
   * A set of resource renderers that are added to the host.
   *
   * @remarks
   *
   * This must be a `Set` to ensure that the same renderer
   * is not added multiple times, which could lead to
   * unexpected behavior when rendering.
   */
  #renderers = new Set<ResourceRenderer>();

  addRenderer(input: ResourceRenderer): void {
    this.#renderers.add(input);
  }

  removeRenderer(input: ResourceRenderer): void {
    this.#renderers.delete(input);
  }

  render(): ReadonlyArray<KnytContent | Promise<KnytContent>> {
    // NOTE: The use of `Array.from` serves two purposes:
    // 1. It creates a shallow copy of the set, so that
    //    we can iterate over it without worrying about
    //    the set being modified while we iterate.
    // 2. It converts the set to an array, so that we can
    //    use `map` to create an array of promises
    //    that we can wait for.
    return Array.from(this.#renderers).map((renderer) => renderer.hostRender());
  }
}
