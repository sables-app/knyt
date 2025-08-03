import { define, dom } from "knyt";

export const Counter = define.element("knyt-counter", {
  lifecycle() {
    const count$ = this.hold(0);

    this.adoptStyleSheet(
      new URL(
        "https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css",
      ),
    );

    return () => {
      return dom.button
        .type("button")
        .onclick(() => count$.value++)
        .$children(`Count: ${count$.value}`);
    };
  },
});
