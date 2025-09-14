import * as knytLuthier from "@knyt/luthier";
import { define as knytDefine } from "@knyt/luthier";
import { define, dom } from "knyt";

// !!! This element should be detected as the default exported element.
export default define.element("knyt-counter", {
  lifecycle() {
    const count$ = this.hold(0);

    return () => {
      return dom.button
        .type("button")
        .onclick(() => count$.value++)
        .$children(`Count: ${count$.value}`);
    };
  },
});

// !!! This element should be detected as an exported element.
export const Button = knytLuthier.define.element("knyt-button", {
  lifecycle() {
    return () => {
      return dom.button.type("button").$children("Click me");
    };
  },
});

// !!! This element should be detected but not as an exported element.
knytDefine.element("not-exported", {
  lifecycle() {
    return () => {
      return dom.button.type("button").$children("Not exported");
    };
  },
});

// !!! This should not be detected as an element at all.
export const NotAnElement = 42;

// !!! This element should not be detected because it's commented out.
//
// export const CommentedOut = define.element("knyt-commented-out", {
//   lifecycle() {
//     return () => {
//       return dom.button.type("button").$children("Commented out");
//     };
//   },
// });

// !!! This element should not be detected because it's inside an IIFE.
(() => {
  define.element("not-exported-in-iife", {
    lifecycle() {
      return () => {
        return dom.button.type("button").$children("Not exported in IIFE");
      };
    },
  });
})();
