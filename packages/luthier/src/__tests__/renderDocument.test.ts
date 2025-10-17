/// <reference types="bun-types" />

import { dom, html, render } from "@knyt/weaver";
import { expect, test } from "bun:test";

import { define } from "../define/mod.ts";

const Head = define.view<{ title?: string; description?: string }>(
  ({ title, description }) => {
    return html`
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link href="../styles/.tailwind.css" rel="stylesheet" />
        <script src="../scripts/main.ts" type="module"></script>
      </head>
    `;
  },
);

const MyHeading = define.element("my-heading-2239cacf90bf", {
  options: {
    shadowRoot: { mode: "closed" },
  },
  properties: {
    title: define.property().string().attribute("title"),
  },
  lifecycle: (host) => {
    return () => dom.h3.$(host.title);
  },
});

const documentDeclaration = html`<!doctype html>
  <html>
    ${Head().title("Hello World").description("This is a test.")}
    <body>
      <main>
        <h1>Hello World</h1>
        ${html.p.$("This is a test.")} ${MyHeading().title("Hello World")}
      </main>
    </body>
  </html>`;

test("document rendering", async () => {
  const htmlText = await render(documentDeclaration, {
    reactiveElementTimeout: 100,
    disableRenderToString: false,
  });

  expect(htmlText).toMatchSnapshot("document rendering");
});
