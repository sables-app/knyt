import type { GetRequestProps, IncludeOptions } from "@knyt/glazier";
import { define, html as h, type InferProps } from "knyt";

import { appMode } from "../lib/appMode";

export const options = {
  serverOnly: true,
} satisfies IncludeOptions;

export const properties = {
  appMode: define.prop.str.attr("app-mode"),
  name: define.prop.str.attr("name"),
  url: define.property<URL>(),
};

type Props = InferProps<typeof properties>;

export const getRequestProps = (async (request) => {
  return {
    props: {
      appMode: appMode.from(request),
      url: new URL(request.url),
    },
  };
}) satisfies GetRequestProps<Props>;

export default define.view(({ appMode, name, url }: Props, { children }) => {
  return h.header.$(
    h.h1.$(`Welcome, ${name}!`),
    h.nav.$(
      h.ul.$(
        h.li.$(h.a.href("/").$("Home")),
        h.li.$(h.a.href("/about").$("About")),
        h.li.$(h.a.href("/contact").$("Contact")),
      ),
    ),
    h.p.$(`The template path is ${url}`),
    h.p.$(`The mode is ${appMode}`),
    children,
  );
});
