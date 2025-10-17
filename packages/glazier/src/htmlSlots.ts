import { hasSlotTag, KnytTagName } from "./importTags.ts";
import { unzipHtml } from "./unzipHtml.ts";

type SlotTag = {
  tagName: KnytTagName.Slot;
  attributes: {
    name?: string;
  };
};

export const DEFAULT_SLOT_NAME = "default";

export type SlotChildren = SlotChildren.ByName | SlotChildren.Single;

export namespace SlotChildren {
  export type ByName = Partial<Record<string, string>>;
  export type Single = string;
}

function normalizeSlotChildren(
  slotChildren: SlotChildren | undefined,
): SlotChildren.ByName {
  if (slotChildren === undefined) {
    return {};
  }
  if (typeof slotChildren === "string") {
    return {
      [DEFAULT_SLOT_NAME]: slotChildren,
    };
  }

  return slotChildren;
}

function assertSlotTags(tags: unzipHtml.Tag[]): asserts tags is SlotTag[] {
  const slotNames = new Set<string>();

  for (const tag of tags) {
    if (tag.tagName !== KnytTagName.Slot) {
      throw new Error(
        `Invalid tag: expected <${KnytTagName.Slot}>, but got <${tag.tagName}>.`,
      );
    }

    const slotName = tag.attributes.name;

    if (typeof slotName == "boolean") {
      throw new Error(
        `Invalid <${KnytTagName.Slot}> tag: name attribute must be a string.`,
      );
    }

    const resolvedSlotName = resolveSlotName(slotName);

    if (slotNames.has(resolvedSlotName)) {
      throw new Error(
        `Duplicate <${KnytTagName.Slot}> tag with resolved name "${resolvedSlotName}" found.`,
      );
    }

    slotNames.add(resolvedSlotName);
  }
}

export function unzipHtmlSlots(htmlText: string): {
  markup: string[];
  tags: SlotTag[];
} {
  const { markup, tags } = unzipHtml(KnytTagName.Slot, htmlText);

  assertSlotTags(tags);

  return { markup, tags };
}

export function zipHtmlSlots(
  markup: string[],
  tags: SlotTag[],
  // `slotChildren` should optional, because even if no children are provided,
  // then function should still be called to remove the <knyt-slot> tags.
  slotChildren?: SlotChildren,
): string {
  const slotChildrenByName = normalizeSlotChildren(slotChildren);

  let htmlText = "";

  for (let i = 0; i < markup.length; i++) {
    htmlText += markup[i];

    if (i < tags.length) {
      const slotTag = tags[i];
      const slotName = resolveSlotName(slotTag.attributes.name);
      const slotContent = slotChildrenByName[slotName];

      if (slotContent) {
        htmlText += slotContent;
      }
    }
  }

  return htmlText;
}

/**
 * Replaces the <knyt-slot> tags in the HTML with the
 * corresponding children HTML.
 */
export function replaceSlotTagsInHtml(
  htmlText: string,
  // `slotChildren` should optional, because even if no children are provided,
  // then function should still be called to remove the <knyt-slot> tags.
  slotChildren?: SlotChildren,
): string {
  if (!hasSlotTag(htmlText)) {
    return htmlText;
  }

  const childrenHtmlBySlotName = normalizeSlotChildren(slotChildren);
  const filledSlotsByName = new Set<string>();

  const rewriter = new HTMLRewriter().on(KnytTagName.Slot, {
    element: (slotElement) => {
      const slotName = resolveSlotName(slotElement.getAttribute("name"));
      const slotContent = childrenHtmlBySlotName[slotName];

      // If the children HTML is not a falsy value,
      // and the slot has not been filled yet.
      if (slotContent && !filledSlotsByName.has(slotName)) {
        // Replace the <knyt-slot> element with the children HTML
        slotElement.replace(slotContent, { html: true });
        filledSlotsByName.add(slotName);
      } else {
        // Otherwise remove the slot element
        slotElement.remove();
      }
    },
  });

  // TypeScript is confused about the overload here for some reason.
  return rewriter.transform(htmlText) as unknown as string;
}

export function resolveSlotName(slotName: string | null | undefined): string {
  if (slotName == null) {
    return DEFAULT_SLOT_NAME;
  }

  if (typeof slotName !== "string") {
    throw new Error(
      `Invalid <${KnytTagName.Slot}> tag: name attribute must be a string.`,
    );
  }

  return slotName;
}
