type EntityId = string | number;

type EntityCollection<T> = readonly T[];

type EntityCollectionsInput<T> = readonly (EntityCollection<T> | undefined)[];

function isNonEmptyCollection<T>(
  collection: EntityCollection<T> | undefined,
): collection is EntityCollection<T> {
  return (collection?.length ?? 0) > 0;
}

function filterEmptyCollections<T>(
  collectionsInput: EntityCollectionsInput<T>,
): EntityCollection<T>[] {
  return collectionsInput.filter(isNonEmptyCollection);
}

/**
 * Merges multiple collections of entities into a single collection.
 */
/*
 * ### Private Remarks
 *
 * This function is used to merge multiple collections of entities into a single collection.
 * It does not merge the entities themselves, but rather the collections they are stored in.
 */
export function mergeEntityCollections<T extends { readonly id: EntityId }>(
  ...collectionsInput: EntityCollectionsInput<T>
): EntityCollection<T> | undefined {
  const collections = filterEmptyCollections(collectionsInput);

  // If there are no collections, return undefined.
  if (collections.length === 0) {
    return undefined;
  }

  // Optimize the case where there is only one collection.
  if (collections.length === 1) {
    return collections[0];
  }

  const map = new Map<EntityId, T>();

  for (const collection of collections) {
    for (const item of collection) {
      // TODO: Decide if a replaced entity should retain its original index.
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}
