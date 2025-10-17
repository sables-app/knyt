import { guessPropertyResetValue } from "./guessPropertyResetValue.ts";
import type { SingularElement } from "./types/mod.ts";

/**
 * Properties that are read-only, but can be assigned by setting an attribute of the same name.
 * These properties are not settable via the DOM API, but can be set via the `setAttribute` method.
 * This is not an exhaustive list, but easy add to support commonly used properties.
 */
enum AttributeWritablePropertyName {
  /**
   * The `form` property is read-only.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/form}
   */
  Form = "form",
  /**
   * The `list` property is read-only.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/list}
   */
  List = "list",
}

/**
 * Properties that are not supported by the renderer.
 */
enum UnsupportedPropertyName {
  OuterHtml = "outerHTML",
  OuterText = "outerText",
}

/**
 * Determines if a property name is an attribute-writable property.
 *
 * @remarks
 *
 * An attribute-writable property is a property that is read-only,
 * but can be assigned by setting an attribute of the same name.
 */
function isAttributeWritablePropertyName(
  value: string,
): value is AttributeWritablePropertyName {
  return (
    value === AttributeWritablePropertyName.Form ||
    value === AttributeWritablePropertyName.List
  );
}

function isUnsupportedPropertyName(
  value: string,
): value is UnsupportedPropertyName {
  return (
    value === UnsupportedPropertyName.OuterHtml ||
    value === UnsupportedPropertyName.OuterText
  );
}

export function setSingularElementProperties(
  target: SingularElement,
  prevProps: Record<string, unknown> | undefined,
  nextProps: Record<string, unknown>,
): void {
  const mergedProps = { ...prevProps, ...nextProps };

  for (const propertyName in mergedProps) {
    const nextValue = Object.hasOwn(nextProps, propertyName)
      ? nextProps[propertyName]
      : guessPropertyResetValue(prevProps, propertyName);

    if (
      prevProps &&
      Object.hasOwn(prevProps, propertyName) &&
      prevProps[propertyName] === nextValue
    ) {
      // If the value is the same, skip changing the property.
      continue;
    }

    if (isUnsupportedPropertyName(propertyName)) {
      console.error(
        `The property "${propertyName}" is not supported by the renderer.`,
      );
      // Ignore unsupported properties.
      continue;
    }

    if (isAttributeWritablePropertyName(propertyName)) {
      target.setAttribute(propertyName, String(nextValue));
    } else {
      (target as unknown as Record<string, unknown>)[propertyName] = nextValue;
    }
  }
}
