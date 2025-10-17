import { dom, type EventHandler } from "@knyt/weaver";

import { define } from "../define/mod.ts";

export const Film = define.component({
  properties: {
    filmId: define.prop.int.attr("film-id"),
    filmTitle: define.prop.str.attr("film-title"),
    rating: define.prop.num.attr("rating"),
    onDelete: define.property<EventHandler.Mouse>(),
    onMount: define.property<() => void>(),
    onUnmount: define.property<() => void>(),
  },
  root: dom.tr,
  lifecycle(host) {
    this.addController({
      hostConnected: () => {
        this.getProp("onMount")?.();
      },
      hostDisconnected: () => {
        this.getProp("onUnmount")?.();
      },
    });

    return ({ props, children, Host }) =>
      dom.fragment.$(
        dom.td.$(props.filmId),
        dom.td.$(props.filmTitle),
        dom.td.$(props.rating),
        dom.td.$(
          dom.button.onclick(props.onDelete ?? null).$("Delete"),
          children,
          Host(),
        ),
      );
  },
});
