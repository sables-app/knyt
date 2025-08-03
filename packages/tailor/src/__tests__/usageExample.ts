import { css } from "@knyt/tailor";

// Write your CSS as a template literal...
const colors = css`
  :root {
    --primary-color: lightblue;
  }
`;

// ...or as an object
const styles = css({
  button: {
    backgroundColor: "var(--primary-color)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  // Pseudo-classes and pseudo-elements are automatically handled
  "button:hover": {
    backgroundColor: "darkblue",
  },
  body: {
    // You can also provide your own selectors as a string or function
    selector: "body",
    styles: {
      margin: "0",
      padding: "2rem",
    },
  },
});

// Style sheets are composable and can be extended
styles.include(colors);

// Fully typed styles with unique class names
console.info(styles.classNames.button); // e.g., "knyt-abc123"

// Add stylesheet to the document (adoptedStyleSheets)
styles.addTo(document);

// Remove it when no longer needed
styles.removeFrom(document);
