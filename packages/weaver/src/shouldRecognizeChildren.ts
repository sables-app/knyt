import type { ElementDeclaration } from "./types/mod";
import { isElementDeclaration, isNodeOpaque, RenderMode } from "./utils/mod";

export function shouldRecognizeChildren(
  declaration: ElementDeclaration.Input,
  element: Element | undefined,
): boolean {
  const { children, props, renderMode } =
    declaration as ElementDeclaration.Internal;

  const isElementOpaque =
    renderMode === RenderMode.Opaque || (element && isNodeOpaque(element));
  const hasChildren = children.length > 0;

  if (isElementOpaque) {
    // TODO: Remove this in production
    if (hasChildren) {
      // TODO: Enable this warning again when we have a better solution for it.
      //
      // This warning is disabled when running in Bun for now, because a false
      // positive is created in Glazier when a Knyt module is included
      // (using `<knyt-include>`) and Glazier automatically adds a `<knyt-slot>`
      // element as a child.
      //
      // The warning is meant to inform users that having children in an opaque
      // declaration is likely a mistake, because the children will be ignored.
      if (typeof Bun === "undefined") {
        console.warn(
          'A declaration should not have children when its `renderMode` is `"opaque"`.',
        );
        console.trace();
      }
    }

    // If the declaration is opaque, then the children of the associated element
    // should not be recognized, because an opaque parent is an element that fully
    // controls the rendering of its children.
    return false;
  }

  // At this point, if the declaration is a markup declaration, then the children
  // of the associated element should be recognized, because the `innerHTML`property
  // and the `innerText` props aren't available as attributes in the markup.
  if (isElementDeclaration.Markup(declaration)) {
    return true;
  }

  // If the props contain an `innerHTML` or `innerText` property, then the children
  // of the associated element should not be recognized.
  // This is because the `innerHTML` or `innerText` property takes precedence over child nodes.
  //
  // The `innerHTML` or `innerText` property is a string that represents the content of the element.
  // If the `innerHTML` or `innerText` property is set, then the children of the element should be ignored.
  //
  // Also take note that the `innerHTML` or `innerText` property is a property of the `Element` interface,
  // so despite its name, it can be used with any element, such as SVG elements.
  //
  // We don't need to check `$innerHTML` here, because `$innerHTML` is a special property that feeds its value
  // into `children`. As a result, it doesn't conflict with `children` in declarations, because it is
  // the `children`.
  const shouldRecognize =
    "innerHTML" in props === false && "innerText" in props === false;

  if (shouldRecognize === false && hasChildren) {
    console.warn(
      "A declaration should not have children when either the `innerHTML` or `innerText` properties are set.",
    );
  }

  return shouldRecognize;
}
