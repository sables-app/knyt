import { dom } from "@knyt/weaver";

import { define } from "../define/mod.ts";

export const SuperHero = define.element("knyt-super-hero", {
  properties: {
    name: define.prop.str.attr("name"),
    alias: define.prop.str.attr("alias"),
    canFly: define.prop.bool.attr("flies"),
    canWallCrawl: define.prop.bool.attr("wall-crawls"),
    innerRef$: define.prop.elementRef<HTMLDivElement>(),
  },
  options: {
    debug: false,
  },
  lifecycle(host) {
    const isActive$ = this.hold(false);

    function handleClick() {
      isActive$.value = !isActive$.value;
    }

    return () => {
      return dom.div
        .$ref(host.innerRef$)
        .className(host.canFly ? "flying" : "")
        .onclick(handleClick)
        .style({
          display: "inline-block",
          border: `1px solid ${isActive$.value ? "#0F0" : "#000"}`,
          padding: "8px",
          borderRadius: "4px",
        })
        .$(`Hello, ${host.alias} (${host.name})!`);
    };
  },
});

export type SuperHeroElement = InstanceType<typeof SuperHero.Element>;
