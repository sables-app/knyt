export function stringToTemplateStringsArray(
  str: string,
): TemplateStringsArray {
  return Object.freeze(
    Object.assign([str], {
      raw: [String.raw({ raw: [str] })],
    }),
  );
}
