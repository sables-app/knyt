export function kebabCaseToPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
