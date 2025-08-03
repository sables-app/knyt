import { hold, ReactiveControllerHostAdapter } from "@knyt/tasker";

class CounterElement extends HTMLElement {
  host = new ReactiveControllerHostAdapter({
    performUpdate: () => this.update(),
  });

  count = hold(this.host, 0);

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  increment = () => {
    this.count.value++;
  };

  render() {
    this.shadowRoot!.innerHTML = `<button type="button">Count: 0</button>`;

    this.shadowRoot!.querySelector("button")!.addEventListener(
      "click",
      this.increment,
    );
  }

  update() {
    this.shadowRoot!.querySelector("button")!.innerText =
      `Count: ${this.count.value}`;
  }
}

customElements.define("knyt-counter", CounterElement);
