import { html } from "../ElementBuilder";
import { defineView } from "../ViewBuilder";

export const Table = defineView<
  { heading?: string; content?: string },
  HTMLTableElement
>(({ heading, content }, { ref }) => {
  return html.table
    .$ref(ref)
    .class("foo")
    .$children(
      html.thead.$children(html.tr.$children(html.th.$children(heading))),
      html.tbody.$children(html.tr.$children(html.td.$children(content))),
    );
});
