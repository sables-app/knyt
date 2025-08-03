import {
  defineGetRequestProps,
  defineIncludeOptions,
  HTMLTemplateFactory,
  type HTMLTemplate,
} from "@knyt/glazier";
import { css, define, dom, InferProps } from "knyt";

import { isDevelopment } from "../lib/appMode";

type Props = InferProps<typeof properties>;

export const options = defineIncludeOptions({
  serverOnly: true,
});

export const properties = {
  footerContent: define.property<HTMLTemplate>(),
  serverMessage: define.property().string(),
  isDevelopment: define.property().boolean(),
};

const styleSheet = css({
  link: {
    color: "blue",
    textDecoration: "none",
    fontWeight: "bold",
  },
});

const htmlTemplates = HTMLTemplateFactory.relativeTo(import.meta.dir);

const FooterContent = await htmlTemplates.define(
  import("./FooterContent.html"),
);

export const getRequestProps = defineGetRequestProps<Props>(async (request) => {
  return {
    props: {
      serverMessage: `This is server-side content from ${request.url}`,
      footerContent: FooterContent,
      isDevelopment: isDevelopment(request),
    },
  };
});

export default define.view<Props>((props, { children }) => {
  const { footerContent, isDevelopment, serverMessage } = props;

  return dom.footer
    .$hx("get", "/api/footer")
    .$hx("trigger", "every 2s")
    .$hx("swap", "outerHTML")
    .$hx("vals", { foo: "bar" })
    .className("ruler")
    .$children(
      styleSheet.style(),
      dom.p.$(isDevelopment ? "Development Mode" : "Not in Development"),
      dom.a
        .className(styleSheet.classNames.link)
        .href("https://sables.app")
        .$children(serverMessage),
      dom.p.$(`Updated on ${new Date().toLocaleString()}`),
      footerContent?.(),
      children,
    );
});
