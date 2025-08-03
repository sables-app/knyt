import { css, define, html } from "knyt";

import { ContactForm } from "./ContactForm";

const styleSheet = css({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
  },
});

export default define.view((_props, { children }) => {
  return html.main
    .class(styleSheet.classNames.container)
    .$children(styleSheet.style(), ContactForm(), children);
});
