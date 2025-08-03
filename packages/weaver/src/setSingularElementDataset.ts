import type { DatasetObject, SingularElement } from "./types/mod";

export function setSingularElementDataset(
  target: SingularElement,
  prevDataset: DatasetObject | undefined,
  nextDataset: DatasetObject,
): void {
  const mergedDataset = { ...prevDataset, ...nextDataset };

  for (const datasetPropertyName in mergedDataset) {
    const nextValue = nextDataset[datasetPropertyName];

    if (
      prevDataset &&
      datasetPropertyName in prevDataset &&
      prevDataset[datasetPropertyName] === nextValue
    ) {
      // If the value is the same, skip changing the dataset property.
      continue;
    }

    // Delete any dataset keys that are not present in the new dataset.
    if (
      datasetPropertyName in nextDataset === false &&
      (prevDataset == null || datasetPropertyName in prevDataset)
    ) {
      // The `delete` operator is used to remove the key from the dataset.
      // This is necessary because setting the value to `undefined` will not remove the key.
      delete target.dataset[datasetPropertyName];
    } else {
      // Skip setting the dataset property if the value is `null` or `undefined`.
      if (nextValue == null) continue;

      target.dataset[datasetPropertyName] = nextValue;
    }
  }
}
