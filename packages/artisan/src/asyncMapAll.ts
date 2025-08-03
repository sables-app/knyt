const DEFAULT_BATCH_SIZE = null;

/**
 * Asynchronously maps over an array of items in batches.
 *
 * @param input     - The array of items to map over.
 * @param mapFn     - The asynchronous mapping function to apply to each item.
 * @param batchSize - The size of each batch. If null, all items are processed
 *                    at once.Defaults to 100.
 */
export async function asyncMapAll<T, U>(
  input: readonly T[],
  mapFn: (item: T) => Promise<U>,
  batchSize: number | null = DEFAULT_BATCH_SIZE,
): Promise<U[]> {
  if (batchSize === null) {
    return Promise.all(input.map(mapFn));
  }

  const result: U[] = [];
  const totaLCount = input.length;
  const batchCount = Math.ceil(totaLCount / batchSize);

  for (let i = 0; i < batchCount; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totaLCount);
    const batch = input.slice(start, end);
    const items = await Promise.all(batch.map(mapFn));

    result.push(...items);
  }

  return result;
}
