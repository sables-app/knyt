export function selectLastELement<T>(arr: readonly T[]): T | undefined {
  return arr.at(arr.length - 1);
}

export function selectFirstElement<T>(arr: readonly T[]): T | undefined {
  return arr.at(0);
}
