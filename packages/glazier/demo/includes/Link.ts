import { define, html, type PropertiesDefinition } from "knyt";

export const properties = {
  href: define.property().string().attribute("href"),
};

type LinkProps = PropertiesDefinition.ToProps<typeof properties>;

export default define.view(({ href }: LinkProps, { children }) =>
  html.a.href(href).$(children),
);
