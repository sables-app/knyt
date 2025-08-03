/**
 * @module
 * TODO: Remove if not needed.
 */

import type { AttributeValue } from "../types/core";

function unknownToDatasetAttributeValue(value: unknown): AttributeValue {
  if (typeof value === "boolean" || value == null) {
    return value;
  }

  return String(value);
}

type DatasetAttributeName = `data-${string}`;
type DatasetAttributes = Record<DatasetAttributeName, AttributeValue>;

function camelCaseToKebabCase(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function datasetPropertyNameToAttributeName(key: string): DatasetAttributeName {
  return `data-${camelCaseToKebabCase(key)}`;
}

function datasetToAttributes(
  dataset: Record<string, unknown>,
): DatasetAttributes {
  const attributes: DatasetAttributes = {};
  const keys = Object.keys(dataset);

  for (let i = 0; i < keys.length; i++) {
    const key = datasetPropertyNameToAttributeName(keys[i]);
    const value = unknownToDatasetAttributeValue(dataset[key]);

    attributes[key] = value;
  }

  return attributes;
}

export {};
