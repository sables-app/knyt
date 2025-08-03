import type { UpdatableParentNode } from "./types/mod";

export function appendAllChildren(
  parent: UpdatableParentNode | DocumentFragment,
  children: NodeListOf<Node> | readonly (Node | null)[],
): void {
  // Looping through the children is significantly faster (and safer) than using `parent.innerHTML = ""`,
  // and appending each child one-by-one provides a better experience for the user than
  // putting all the children in a single document fragment and appending it all at once.
  //
  // TODO: Test changing to alternative methods of appending children based on the number of children.
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child) {
      parent.appendChild(child);
    }
  }
}
