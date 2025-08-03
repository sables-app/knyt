import { describe, expect, it, mock } from "bun:test";

import { build } from "../build/mod";
import { svg } from "../ElementBuilder";
import { isElementDeclaration } from "../utils/mod";

describe("svg", async () => {
  it("can be called as a template tag with SVG", async () => {
    // prettier-ignore
    const declaration = svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16"><path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/></svg>`;

    expect(isElementDeclaration.Fragment(declaration)).toBe(true);

    // `build` should always return a `DocumentFragment`
    // when the input is a `Fragment`, even if the fragment
    // contains a single element.
    const fragment = await build<DocumentFragment>(declaration);

    expect(fragment instanceof DocumentFragment).toBe(true);
    expect(fragment.childNodes.length).toBe(1);

    const svgEl = fragment.children[0] as SVGSVGElement;

    expect(svgEl instanceof SVGSVGElement).toBe(true);
    expect(svgEl.tagName).toBe("svg");
    expect(svgEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svgEl.attributes.length).toBe(6);
    expect(svgEl.getAttribute("class")).toBe("bi bi-box");
    expect(svgEl.getAttribute("height")).toBe("16");
    expect(svgEl.getAttribute("fill")).toBe("currentColor");
    expect(svgEl.children.length).toBe(1);

    const path = svgEl.children[0] as SVGPathElement;

    expect(path instanceof SVGPathElement).toBe(true);
    expect(path.tagName).toBe("path");
    expect(path.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(path.attributes.length).toBe(1);
  });

  it("can be called as a template tag with SVG and interpolated values", async () => {
    const handleClick = mock();

    // prettier-ignore
    const declaration = svg`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16">${
      svg.path.d("M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0").$on('click', handleClick)
    }</svg>`;

    const fragment = await build<DocumentFragment>(declaration);

    expect(fragment instanceof DocumentFragment).toBe(true);
    expect(fragment.childNodes.length).toBe(1);

    const svgEl = fragment.children[0] as SVGSVGElement;

    expect(svgEl instanceof SVGSVGElement).toBe(true);
    expect(svgEl.tagName).toBe("svg");

    const path = svgEl.children[0] as SVGPathElement;

    expect(path instanceof SVGPathElement).toBe(true);
    expect(path.tagName).toBe("path");

    expect(handleClick).not.toHaveBeenCalled();

    const clickEvent = new Event("click");

    path.dispatchEvent(clickEvent);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(clickEvent);
  });
});
