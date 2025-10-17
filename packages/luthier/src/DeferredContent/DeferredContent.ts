import { css } from "@knyt/tailor";
import { dom } from "@knyt/weaver";

import { defineKnytElement } from "../define/defineKnytElement.ts";
import { DeferredContentController } from "./DeferredContentController.ts";

enum DeferredContentSlot {
  Placeholder = "placeholder",
  Default = "",
}

export const DeferredContent = Object.assign(
  defineKnytElement({
    tagName: "knyt-deferred-content",
    styleSheet: css`
      :host {
        display: contents;
      }
    `,
    lifecycle() {
      const controller = new DeferredContentController(this);

      return () => {
        const isLoading = controller.isLoading$.value;

        return dom.fragment.$(
          dom.div
            .$key("content")
            .hidden(isLoading)
            .ariaHidden(String(isLoading))
            .style({ display: isLoading ? "none" : "contents" })
            .$(dom.slot.name(DeferredContentSlot.Default)),
          dom.div
            .$key("placeholder")
            .hidden(!isLoading)
            .ariaHidden(String(!isLoading))
            .style({ display: isLoading ? "contents" : "none" })
            .$(
              isLoading ? dom.slot.name(DeferredContentSlot.Placeholder) : null,
            ),
        );
      };
    },
  }),
  {
    Slot: DeferredContentSlot,
  },
);
