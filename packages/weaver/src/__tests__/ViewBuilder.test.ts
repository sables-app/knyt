import { typeCheck } from "@knyt/artisan";
import { describe, expect, it, mock } from "bun:test";

import { html } from "../ElementBuilder";
import { render } from "../render/mod";
import type { ViewBuilder } from "../types/mod";
import {
  assertElementBuilder,
  assertViewBuilder,
  getElementDeclarationFromViewBuilder,
  getMutableElementDeclarationFromElementBuilder,
  getViewDeclaration,
  isElementDeclaration,
} from "../utils/mod";
import { defineView } from "../ViewBuilder";

describe("defineView", async () => {
  it("produces a template that build views", async () => {
    type Props = {
      title?: string;
      content?: string;
    };

    const Homepage = defineView(({ title, content }: Props) => {
      return html.div
        .class("container")
        .$children(html.h1.$children(title), html.p.$children(content));
    });

    const viewBuilder = Homepage()
      .$key("foo")
      .$ref((value) => {})
      .title("Hello, World!")
      .$props({ content: "Lorem ipsum" });

    assertViewBuilder(viewBuilder);

    const viewDeclaration = getViewDeclaration(viewBuilder);

    const elementBuilder = await viewDeclaration.render(viewDeclaration.props, {
      children: html.fragment.$children(...viewDeclaration.children),
      ref: viewDeclaration.ref as any,
      key: viewDeclaration.key,
    });

    assertElementBuilder(elementBuilder);

    const elementDeclaration =
      getMutableElementDeclarationFromElementBuilder(elementBuilder);

    expect(isElementDeclaration(elementDeclaration)).toBe(true);

    const markup = await render(elementDeclaration);

    expect(markup).toBe(
      '<div class="container"><h1>Hello, World!</h1><p>Lorem ipsum</p></div>',
    );
  });

  it("should produces an invalid template when props aren't optional", async () => {
    type RequiredProps = { heading: string };

    // @ts-expect-error Required props should not be optional
    const ContactPage = defineView<RequiredProps>(({ heading }) => {
      return html.div.class("container").$children(heading);
    });

    const result = ContactPage();

    typeCheck<ViewBuilder<{ KnytError: "🚨 All props must be optional." }>>(
      typeCheck.identify(result),
    );
  });

  it("should accept an async render function", async () => {
    type Props = { heading?: Promise<string> };

    const ContactPage = defineView<Props>(async ({ heading }) => {
      return html.div
        .class("container")
        .$children(html.h1.$children(await heading));
    });

    const markup = await render(
      ContactPage().heading(Promise.resolve("Hello, everyone!")),
    );

    expect(markup).toBe(
      '<div class="container"><h1>Hello, everyone!</h1></div>',
    );
  });

  it("sets `children` to `undefined` when no children are provided", async () => {
    const render = mock((props, { key, ref, children }) =>
      html.div.$key(key).$ref(ref).$children(children),
    );
    const MyView = defineView(render);
    const _declaration = await getElementDeclarationFromViewBuilder(MyView());

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0]).toEqual([
      {},
      {
        children: undefined,
        ref: undefined,
        key: undefined,
      },
    ]);
  });

  it("sets `children` to a fragment when children are provided", async () => {
    const render = mock((props, { key, ref, children }) =>
      html.div.$key(key).$ref(ref).$children(children),
    );
    const MyView = defineView(render);
    const _declaration = await getElementDeclarationFromViewBuilder(
      MyView().$children("Hello, World!"),
    );

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0]).toEqual([
      {},
      {
        children: expect.objectContaining({
          children: ["Hello, World!"],
        }),
        ref: undefined,
        key: undefined,
      },
    ]);
  });
});
