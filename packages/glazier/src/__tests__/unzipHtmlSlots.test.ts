import { beforeAll, describe, expect, it, mock } from "bun:test";

import { KnytTagName } from "../importTags.ts";
import { unzipHtmlSlots } from "../htmlSlots.ts";

describe("unzipHtmlSlots", () => {
  it("should correctly parse valid <knyt-slot> tags", () => {
    const htmlText = `
      <knyt-slot name="header"></knyt-slot>
      <knyt-slot name="footer"></knyt-slot>
    `;
    const result = unzipHtmlSlots(htmlText);

    expect(result.markup).toEqual(["", "", ""]);
    expect(result.tags).toEqual([
      { tagName: KnytTagName.Slot, attributes: { name: "header" } },
      { tagName: KnytTagName.Slot, attributes: { name: "footer" } },
    ]);
  });

  it("should handle <knyt-slot> tags with no name attribute", () => {
    const htmlText = `
      <knyt-slot></knyt-slot>
      <knyt-slot name="custom"></knyt-slot>
    `;
    const result = unzipHtmlSlots(htmlText);

    expect(result.markup).toEqual(["", "", ""]);
    expect(result.tags).toEqual([
      { tagName: KnytTagName.Slot, attributes: { name: "default" } },
      { tagName: KnytTagName.Slot, attributes: { name: "custom" } },
    ]);
  });

  it("should return non-slot tags as markup", () => {
    const htmlText = `
      <knyt-slot name="header"></knyt-slot>
      <div></div>
    `;

    const result = unzipHtmlSlots(htmlText);

    expect(result.markup).toEqual(["", "<div></div>"]);
    expect(result.tags).toEqual([
      { tagName: KnytTagName.Slot, attributes: { name: "header" } },
    ]);
  });

  it("should throw an error for duplicate slot names", () => {
    const htmlText = `
      <knyt-slot name="header"></knyt-slot>
      <knyt-slot name="header"></knyt-slot>
    `;

    expect(() => unzipHtmlSlots(htmlText)).toThrowError(
      'Duplicate <knyt-slot> tag with resolved name "header" found.',
    );
  });

  it("should throw an error if the name attribute is a boolean", () => {
    const htmlText = `
      <knyt-slot name></knyt-slot>
    `;

    expect(() => unzipHtmlSlots(htmlText)).toThrowError(
      "Invalid <knyt-slot> tag: name attribute must be a string.",
    );
  });

  it("should ignore content inside <knyt-slot> tags", () => {
    const htmlText = `
      <main>
      <h1>Title</h1>
      <knyt-slot name="header">Header Content</knyt-slot>
      <knyt-slot name="footer">Footer Content</knyt-slot>
      <p>Some content</p>
      </main>
    `;
    const result = unzipHtmlSlots(htmlText);

    expect(result.markup).toEqual([
      "<main>\n      <h1>Title</h1>",
      "",
      "<p>Some content</p>\n      </main>",
    ]);
    expect(result.tags).toEqual([
      { tagName: KnytTagName.Slot, attributes: { name: "header" } },
      { tagName: KnytTagName.Slot, attributes: { name: "footer" } },
    ]);
  });

  it("should throw an error for nested <knyt-slot> tags", () => {
    const htmlText = `
      <knyt-slot name="header">
        <knyt-slot name="nested"></knyt-slot>
      </knyt-slot>
    `;

    expect(() => unzipHtmlSlots(htmlText)).toThrowError(
      "Nested <knyt-slot> tags are not allowed.",
    );
  });
});
