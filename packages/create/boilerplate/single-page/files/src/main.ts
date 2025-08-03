import { css, define, html } from "knyt";

import Counter from "./Counter";

define.element("my-app", {
  styleSheet: css`
    my-app {
      display: contents;
    }
  `,
  options: {
    renderMode: "opaque",
    shadowRoot: false,
  },
  lifecycle() {
    return () => html`
      <main>
        <h1>Welcome to Your Knyt App! 🎉</h1>
        <p>This is the starting point for your new single-page application.</p>
        <blockquote>${Counter()}</blockquote>
        <h2>🚀 Get Started</h2>
        <ul>
          <li>Edit this content: <code>./src/main.ts</code></li>
          <li>Explore the project structure.</li>
          <li>Start building your features!</li>
        </ul>
        <h2>📚 Useful Links</h2>
        <ul>
          <li><a href="https://knyt.dev/docs">Knyt Documentation</a></li>
          <li><a href="https://bun.sh/docs">Bun Documentation</a></li>
        </ul>
        <hr />
        <p>Happy coding!</p>
      </main>
    `;
  },
});
