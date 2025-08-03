import {
  isDocumentFragment,
  isElement,
  isText,
  isUnknownDictionary,
  shallowEqual,
  typeCheck,
} from "@knyt/artisan";

import { appendAllChildren } from "../appendAllChildren";
import { addListenersToElement, build } from "../build/mod";
import { type InferNativeHandler } from "../inferHelpers";
import { setSingularElementAttributes } from "../setSingularElementAttributes";
import { setSingularElementDataset } from "../setSingularElementDataset";
import { setSingularElementProperties } from "../setSingularElementProperties";
import {
  isNonNullableStyleInput,
  setSingularElementStyle,
} from "../setSingularElementStyle";
import { shouldRecognizeChildren } from "../shouldRecognizeChildren";
import type {
  AnyProps,
  DatasetObject,
  ElementDeclaration,
  FlattenedElementDeclarationChild,
  FlattenedElementDeclarationChildren,
  KnytDeclaration,
  ListenerDeclaration,
  SingularElement,
  UpdatableParentNode,
} from "../types/mod";
import {
  attachElementDeclaration,
  createFragmentDeclaration,
  getElementDeclaration,
  getElementDeclarationKey,
  getSingularElementTagName,
  isElementDeclaration,
  normalizeElementDeclarationRef,
} from "../utils/mod";
import { flattenElement } from "./flatten";
import {
  createSharedOptions,
  type UpdateOptions,
  type UpdateOptionsWithDocument,
} from "./options";

// Banned globals
declare const document: never;
declare const window: never;

type BuildChildResult =
  | Element
  | Text
  | Promise<SingularElement.WithDeclaration<SingularElement>>;

/**
 * Builds a child node from a flattened ElementDeclaration child.
 */
function buildChild(
  child: Element,
  options: UpdateOptionsWithDocument,
): Element;

function buildChild(child: string, options: UpdateOptionsWithDocument): Text;

function buildChild(
  child: ElementDeclaration.Singular,
  options: UpdateOptionsWithDocument,
): Promise<SingularElement.WithDeclaration<SingularElement>>;

function buildChild(
  child: FlattenedElementDeclarationChild,
  options: UpdateOptionsWithDocument,
): BuildChildResult;

function buildChild(
  child: FlattenedElementDeclarationChild,
  options: UpdateOptionsWithDocument,
): BuildChildResult {
  if (typeof child === "string") {
    const $document = options.document ?? globalThis.document;

    // NOTE: Creating a text node effectively escapes the string and prevents XSS attacks.
    return $document.createTextNode(child);
  }
  if (isElement(child)) {
    return child;
  }

  return build<SingularElement.WithDeclaration<SingularElement>>(
    child as ElementDeclaration.Input,
    createSharedOptions(options),
  );
}

/**
 * @internal scope: workspace
 */
export function removeAllChildren(parent: UpdatableParentNode): void {
  // Looping through the children is significantly faster than using `parent.innerHTML = ""`
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild!);
  }
}

/**
 * The default chunk size for appending children to the parent element.
 * This is used to limit the number of children that are appended at once
 * to avoid blocking the main thread for too long.
 *
 * This is an arbitrary value, but it should be high enough to allow for
 * longer lists of children to be appended without blocking the main thread.
 */
// TODO: Dynamically adjust the default chunk size based on the environment
const DEFAULT_CHUNK_SIZE = 50_000;

async function buildAndAppendAllChildren(
  parent: UpdatableParentNode,
  nextChildren: Readonly<FlattenedElementDeclarationChildren>,
  options: UpdateOptions,
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };
  const logger = options.logger ?? {};
  const timeId = `build-and-append-all-children-${Math.random()
    .toString(16)
    .slice(2)}`;

  logger.time?.(timeId);

  const appendChunkSize = options.appendChunkSize ?? DEFAULT_CHUNK_SIZE;
  const totalCount = nextChildren.length;

  for (let i = 0; i < totalCount; i += appendChunkSize) {
    const remainingCount = totalCount - i;
    const chunk = nextChildren.slice(i, i + appendChunkSize);
    const isLastChunk = appendChunkSize >= remainingCount;
    const fragment = await build(
      createFragmentDeclaration(chunk),
      createSharedOptions(optionsWithDocument),
    );

    parent.appendChild(fragment);

    if (!isLastChunk) {
      await new Promise(requestAnimationFrame);
    }
  }

  logger.timeEnd?.(timeId);
}

// TODO: Consider providing a cache map to avoid repeating lookups
function getChildKey(
  child: Node | ElementDeclaration.Singular | string,
): string | undefined {
  if (typeof child === "string") {
    // Text nodes don't have keys
    return undefined;
  }
  if (isElementDeclaration.Singular(child)) {
    // If the child is an ElementDeclaration, then return the key
    // from the ElementDeclaration if it exists.
    return child.key;
  }

  // If the child is an Element, then return the key from either
  // the ElementDeclaration or the DOM element itself.
  return getElementDeclarationKey(child);
}

function getChildAtPosition<
  T extends Node | ElementDeclaration.Singular | string,
>(
  children: readonly T[],
  position: number,
): [child: undefined, key: undefined] | [child: T, key: string | undefined] {
  const child = children.at(position);

  if (child === undefined) {
    return [undefined, undefined];
  }

  const key = getChildKey(child);

  return [child, key];
}

/**
 * The maximum depth of the DOM tree to traverse when updating children.
 * This is used to prevent infinite loops in the update algorithm.
 */
/*
 * ### Private Remarks
 *
 * This is an arbitrary value, but it should be high enough to
 * allow for deep trees to be updated while providing a safeguard
 * against infinite loops.
 */
const MAX_DEPTH = 1000;

/**
 * Updates the children of a parent element.
 */
async function updateDomElementChildren(
  parent: UpdatableParentNode,
  newChildren: Readonly<FlattenedElementDeclarationChildren>,
  options: UpdateOptions,
  depth = 0,
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };
  const logger = options.logger ?? {};

  // It _must_ be a new array, because `parent.childNodes` is a live NodeList,
  // and mutating it will cause the indexes to shift.
  const oldChildren = Array.from(parent.childNodes);

  // Optimizations for common cases
  {
    if (depth > MAX_DEPTH) {
      throw new Error("Depth exceeded.");
    }
    if (oldChildren.length === 0 && newChildren.length === 0) {
      // Do nothing if there are no children to add or remove
      logger.log?.("No children to add or remove");
      return;
    }
    if (newChildren.length === 0) {
      logger.log?.("Removing all children");
      removeAllChildren(parent);
      return;
    }
    if (oldChildren.length === 0) {
      logger.log?.("Appending all children");
      await buildAndAppendAllChildren(parent, newChildren, options);
      return;
    }
  }

  // Core comparison algorithm
  {
    const timeId = `core-update-loop-${Math.random().toString(16).slice(2)}`;

    logger.time?.(timeId);

    let oldHead = 0;
    let newHead = 0;
    let oldTail = oldChildren.length - 1;
    let newTail = newChildren.length - 1;

    const matchedKeys = new Set<string>();

    // First, attempt to update the children from the start of the list
    // until we find a child that doesn't match.
    while (newHead <= newTail && oldHead <= oldTail) {
      const [oldChild, oldKey] = getChildAtPosition(oldChildren, oldHead);
      const [newChild, newKey] = getChildAtPosition(newChildren, newHead);

      if (typeof oldKey !== "string" || oldKey !== newKey) {
        break;
      }

      matchedKeys.add(newKey);

      await updateNode(parent, oldChild, newChild, options, depth + 1);

      oldHead++;
      newHead++;

      logger.log?.("Updated from head");
    }

    // Then, attempt to update the children from the end of the list
    // until we find a child that doesn't match.
    while (newHead <= newTail && oldHead <= oldTail) {
      const [oldChild, oldKey] = getChildAtPosition(oldChildren, oldTail);
      const [newChild, newKey] = getChildAtPosition(newChildren, newTail);

      if (typeof oldKey !== "string" || oldKey !== newKey) {
        break;
      }

      matchedKeys.add(newKey);

      oldTail--;
      newTail--;

      await updateNode(parent, oldChild, newChild, options, depth + 1);

      logger.log?.("Updated from tail");
    }

    childProcessing: {
      // If the old head is greater than the old tail,
      // then all old children have been processed.
      if (oldHead > oldTail) {
        const oldChild = oldChildren.at(oldHead);

        // So we can just append all new children to the end of the list.
        while (newHead <= newTail) {
          logger.log?.("all new children");

          const newChild = newChildren.at(newHead);

          // TODO: Remove this check in production
          if (!newChild) {
            // This should never happen, because the children are
            // within the bounds of the array.
            throw new Error("Child is undefined");
          }

          parent.insertBefore(
            await buildChild(newChild, optionsWithDocument),
            // Either insert before the old child, or at the end of the list.
            oldChild ?? null,
          );

          newHead++;
        }

        break childProcessing;
      }

      // If the new head is greater than the new tail,
      // then all new children have been processed.
      if (newHead > newTail) {
        // So we can just remove all old children from the list.
        while (oldHead <= oldTail) {
          logger.log?.(
            "No more new children. Removing remaining old children.",
          );

          const oldChild = oldChildren.at(oldHead);

          if (!oldChild) {
            // This should never happen, because the children are
            // within the bounds of the array.
            throw new Error("Child is undefined");
          }

          parent.removeChild(oldChild);

          oldHead++;
        }

        break childProcessing;
      }

      /**
       * A map of old children by their keys.
       */
      const oldChildByKey = new Map<string, ChildNode>();

      // Add all old children with keys to the map
      for (let i = oldHead; i <= oldTail; i++) {
        const oldChild = oldChildren.at(i);

        if (!oldChild) {
          // This should never happen, because the children are
          // within the bounds of the array.
          throw new Error("Child is undefined");
        }

        const oldKey = getChildKey(oldChild);

        if (oldKey !== undefined) {
          oldChildByKey.set(oldKey, oldChild);
        }
      }

      // While there are still children to process
      while (newHead <= newTail) {
        logger.log?.({ newHead, newTail, oldHead, oldTail });

        const [oldChild, oldKey] = getChildAtPosition(oldChildren, oldHead);
        const [newChild, newKey] = getChildAtPosition(newChildren, newHead);

        if (!newChild) {
          // This should never happen, because the child is
          // within the bounds of the array.
          throw new Error("Child is undefined");
        }

        // Handles the case where the new child matches the subsequent old child
        subsequentChild: {
          const [_subsequentOldChild, subsequentOldKey] = getChildAtPosition(
            oldChildren,
            oldHead + 1,
          );

          // This is an optimization that checks covers the case where
          // individual children are removed in a list of children.
          // Old: [A, B, C, D, E, F]
          // New: [A, C, D, F]

          if (
            newKey === undefined ||
            newKey !== subsequentOldKey ||
            !oldChild
          ) {
            break subsequentChild;
          }

          logger.log?.(
            "Removing old child, because the subsequent key is the same",
          );

          // If the new key is the same as the subsequent old key,
          // and the old key is undefined, then we can simply
          // remove the old child and move on to the next one.
          parent.removeChild(oldChild);

          // Also remove the child from the old children array.
          const oldChildIndex = oldChildren.indexOf(oldChild);

          if (oldChildIndex > -1) {
            oldChildren.splice(oldChildIndex, 1);
            oldTail--;
          }

          // Continue to the next iteration without updating the
          // `newHead` so the same new child can be processed again.
          continue;
        }

        // Handles the case where the new child has a key, and the old child has the same key
        if (
          newKey !== undefined &&
          // To clarify, this means that both keys are either the same string,
          // or both keys are `undefined`.
          newKey === oldKey &&
          oldChild
        ) {
          logger.log?.(
            "Updating old child, because the keys are the same",
            newKey,
          );

          matchedKeys.add(newKey);

          logger.log?.({
            oldChildDeclaration: getElementDeclaration(oldChild),
            newChildDeclaration: newChild,
          });

          await updateNode(parent, oldChild, newChild, options, depth + 1);

          newHead++;
          oldHead++;
          continue;
        }

        // Handles the case where the new child has a key,
        // and a matching old child is found in the map.
        matchingOldChild: {
          if (newKey !== undefined) {
            logger.log?.(
              "Attempt to match an old child, because the new key is defined",
              newKey,
            );

            // Attempt to match an old child, because the new key is defined
            const matchedOldChild = oldChildByKey.get(newKey);

            if (!matchedOldChild) {
              break matchingOldChild;
            }

            logger.log?.("Matched old child, and moving it.", newKey);

            matchedKeys.add(newKey);

            const [_beforeOldChild, beforeOldKey] = getChildAtPosition(
              oldChildren,
              oldHead,
            );
            const [_beforeNewChild, beforeNewKey] = getChildAtPosition(
              newChildren,
              newHead,
            );

            {
              // If a matching child is found, then insert it at the position of the old child.
              parent.insertBefore(matchedOldChild, oldChild ?? null);

              // Also move the child in the old children array to the new position.
              if (oldChild) {
                const matchedChildIndex = oldChildren.indexOf(matchedOldChild);

                if (matchedChildIndex > -1) {
                  oldChildren.splice(matchedChildIndex, 1);
                  oldTail--;
                }

                oldChildren.splice(oldHead, 0, matchedOldChild);
                oldTail++;
              } else {
                oldChildren.push(matchedOldChild);
              }
            }

            const [afterOldChild, afterOldKey] = getChildAtPosition(
              oldChildren,
              oldHead,
            );
            const [_afterNewChild, afterNewKey] = getChildAtPosition(
              newChildren,
              newHead,
            );

            if (afterOldKey === undefined) {
              logger.log?.({
                oldChildIsDefined: oldChild !== undefined,
                beforeOldKey,
                beforeNewKey,
                afterOldKey,
                afterNewKey,
                afterOldChildIsDefined: afterOldChild !== undefined,
                matchedOldChildKey: getChildKey(matchedOldChild),
              });

              throw new Error("Old key is undefined");
            }

            // Continue to the next iteration without updating the
            // heads so the same new child and matched old child can be processed again.
            continue;
          }
        }

        // If there is an old child to update, then update it.
        if (oldChild) {
          await updateNode(parent, oldChild, newChild, options, depth + 1);

          newHead++;
          oldHead++;
          continue;
        }

        logger.log?.("Building new child, because the old child is undefined");

        // If there is no old child, then build the new child and insert
        // idt at the end of the list.
        parent.insertBefore(
          await buildChild(newChild, optionsWithDocument),
          null,
        );

        newHead++;
        continue;
      }

      logger.log?.({ oldHead, oldTail, newHead, newTail });

      // Remove any remaining old children that don't have keys
      while (oldHead <= oldTail) {
        const [oldChild] = getChildAtPosition(oldChildren, oldHead);

        if (oldChild && getElementDeclarationKey(oldChild) === undefined) {
          parent.removeChild(oldChild);
        }

        oldHead++;
      }

      logger.log?.("matchedKeys", matchedKeys);

      // Remove any old children that were not matched by key
      for (const [key, oldChild] of oldChildByKey) {
        if (!matchedKeys.has(key) && oldChild.parentNode === parent) {
          logger.log?.(
            "Removing old child, because it was not matched by key",
            key,
          );
          parent.removeChild(oldChild);
        }
      }
    }

    logger.timeEnd?.(timeId);
  }
}

/**
 * Updates the attributes, listeners, and children of an `SingleElement`
 * using a markup element declaration.
 */
// TODO: Break down into smaller functions
async function updateSingularElementWithMarkup(
  element: SingularElement,
  nextDeclaration: ElementDeclaration<
    ElementDeclaration.MarkupProps,
    SingularElement
  >,
  prevDeclaration:
    | ElementDeclaration<ElementDeclaration.MarkupProps, SingularElement>
    | undefined,
  options: UpdateOptions,
) {
  const $document = options.document ?? element.ownerDocument;
  const nextAttributesFromProps = nextDeclaration.props;
  const prevAttributesFromProps = prevDeclaration?.props ?? {};

  const {
    dataset: nextDataset,
    style: nextStyle,
    ...nextOtherAttributes
  } = nextAttributesFromProps;
  const {
    dataset: prevDataset,
    style: prevStyle,
    ...prevOtherAttributes
  } = prevAttributesFromProps;

  const nextAttributes = {
    ...nextOtherAttributes,
    ...(nextDeclaration.attributes ?? {}),
  };
  const prevAttributes = {
    ...prevOtherAttributes,
    ...(prevDeclaration?.attributes ?? {}),
  };

  setSingularElementAttributes(
    element,
    prevDeclaration ? prevAttributes : undefined,
    nextAttributes,
  );

  if (
    isNonNullableStyleInput(prevStyle) ||
    isNonNullableStyleInput(nextStyle)
  ) {
    // Use `setSingularElementStyle` for setting style attributes
    // as it is more efficient than setting each style attribute
    // which would trigger the CSS parser.
    setSingularElementStyle(element, prevStyle, nextStyle ?? {});
  }

  if (isUnknownDictionary(nextDataset)) {
    // Use `setSingularElementDataset` for setting dataset attributes
    // as it is more efficient than rendering each dataset attribute
    // name and value.
    setSingularElementDataset(element, prevDataset, nextDataset);
  } else {
    typeCheck<undefined>(typeCheck.identify(nextDataset));
  }

  // Update listeners last to ensure that we don't inadvertently encourage
  // listening to any potential side-effects caused by the property updates,
  // which shouldn't be the case, but it's a good practice to follow.
  updateListeners(element, nextDeclaration, prevDeclaration);
}

/**
 * Updates the properties, listeners, and children of an `SingleElement`
 * using a DOM element declaration.
 */
// TODO: Break down into smaller functions
async function updateSingularElementWithDom(
  element: SingularElement,
  nextDeclaration: ElementDeclaration<AnyProps, SingularElement>,
  prevDeclaration: ElementDeclaration<AnyProps, SingularElement> | undefined,
  options: UpdateOptions,
) {
  const nextResolvedProps = nextDeclaration.props;
  const prevResolvedProps = prevDeclaration?.props ?? {};

  const {
    dataset: nextDataset,
    style: nextStyle,
    ...nextOtherProps
  } = nextResolvedProps;

  const {
    dataset: prevDataset,
    style: prevStyle,
    ...prevOtherProps
  } = prevResolvedProps;

  // TODO: Add debug only assertion for invalid props (e.g. outerHTML and outerText)

  setSingularElementProperties(
    element,
    prevDeclaration ? prevOtherProps : undefined,
    nextOtherProps,
  );

  if (
    isNonNullableStyleInput(prevStyle) ||
    isNonNullableStyleInput(nextStyle)
  ) {
    setSingularElementStyle(element, prevStyle, nextStyle ?? {});
  }

  if (isUnknownDictionary(nextDataset)) {
    const prevDataset: unknown = prevDeclaration?.props?.dataset;

    setSingularElementDataset(
      element,
      prevDataset as DatasetObject | undefined,
      nextDataset as DatasetObject,
    );
  }

  const nextAttributes = nextDeclaration.attributes;
  const prevAttributes = prevDeclaration?.attributes;

  if (nextAttributes || prevAttributes) {
    setSingularElementAttributes(element, prevAttributes, nextAttributes ?? {});
  }

  // Update listeners last to ensure that we don't inadvertently encourage
  // listening to any potential side-effects caused by the property updates,
  // which shouldn't be the case, but it's a good practice to follow.
  updateListeners(element, nextDeclaration, prevDeclaration);
}

function updateListeners(
  element: SingularElement,
  nextDeclaration: ElementDeclaration<AnyProps, SingularElement>,
  prevDeclaration: ElementDeclaration<AnyProps, SingularElement> | undefined,
) {
  const nextListeners = nextDeclaration.listeners;
  const prevListeners = prevDeclaration?.listeners;

  // If the previous listeners and the next listeners are both `undefined`,
  // then do nothing.
  if (!prevListeners && !nextListeners) {
    // Do nothing
  }
  // If the previous listeners are not defined, but the next listeners are,
  // then add all the next listeners.
  else if (!prevListeners && nextListeners) {
    addListenersToElement(element, nextListeners);
  } else {
    /**
     * A merged object of all of the listeners,
     * so that we can easily iterate over all of the keys
     * for both the previous and next listeners.
     */
    const mergedListeners = { ...prevListeners, ...nextListeners };

    for (const key in mergedListeners) {
      const prevListener = prevListeners?.[key];
      const nextListener = nextListeners?.[key];

      if (areListenersEqual(prevListener, nextListener)) {
        continue;
      }

      if (prevListener) {
        element.removeEventListener(
          prevListener.type,
          prevListener.handler as InferNativeHandler<
            typeof prevListener.handler
          >,
          prevListener.options,
        );
      }

      if (nextListener) {
        element.addEventListener(
          nextListener.type,
          nextListener.handler as InferNativeHandler<
            typeof nextListener.handler
          >,
          nextListener.options,
        );
      }
    }
  }
}

/**
 * Determines whether a node can be updated by the renderer.
 */
function isNodeUpdatable(node: Node): node is SingularElement | Text {
  return isElement(node) || isText(node);
}

/**
 * Updates a child node.
 */
// TODO: Convert parameters to a single object
async function updateNode(
  parent: UpdatableParentNode,
  prevChild: ChildNode,
  nextChild: FlattenedElementDeclarationChild,
  options: UpdateOptions,
  depth = 0,
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };
  const logger = options.logger ?? {};
  // TODO: Remove in production
  // const timeId = `update-node-${Math.random().toString(16).slice(2)}`;

  // logger.time?.(timeId);

  if (!isNodeUpdatable(prevChild)) {
    // If the previous child is not a node that can be updated,
    // then we should replace it with the new child.
    await replaceSubtree(parent, nextChild, prevChild, options);
    return;
  }

  if (typeof nextChild === "string") {
    if (isText(prevChild)) {
      if (prevChild.textContent !== nextChild) {
        // NOTE: Setting the `textContent` effectively escapes the string and prevents XSS attacks.
        prevChild.textContent = nextChild;
      }
    } else {
      await replaceSubtree(parent, nextChild, prevChild, options);
    }

    return;
  }

  if (
    // If the previous child is a text node, and the next child is not a text node (a `string` value).
    // Note: the next child is checked in the previous condition.
    isText(prevChild) ||
    // If the new element is an Element, it should replace the target.
    // We should not be updating the target.
    // The new element should be a complete replacement.
    // This is an intentional design decision, because it avoids
    // making assumptions about the target's state.
    // The target may have been modified by other code.
    // The new element should be treated like a black box.
    isElement(nextChild)
  ) {
    await replaceSubtree(parent, nextChild, prevChild, options);
    return;
  }

  const { type: nextType, key } = nextChild;
  const targetKey = getElementDeclarationKey(prevChild);

  if (key !== targetKey) {
    // If the keys are different, then we should explicitly replace the child.
    // The child shouldn't be updated, because the key is used to identify
    // the child in the DOM tree.
    //
    // This is an intentional design decision, because it avoids
    // making assumptions about the target's state.
    //
    // It's the expected behavior of the renderer, that if the key changes,
    // then a new child should be created.
    await replaceContainingElement(
      parent,
      nextChild,
      prevChild,
      options,
      depth + 1,
    );
    return;
  }

  // TODO: Remove in production
  if (isElementDeclaration.Fragment(nextChild)) {
    // This should never happen, but it's a good sanity check.
    throw new Error("Fragments should have been flattened at this point.");
  }

  const prevType = getSingularElementTagName(prevChild);

  // If both the previous and next child are singular elements,
  // but the types are different.
  if (prevType !== nextType) {
    await replaceContainingElement(
      parent,
      nextChild,
      prevChild,
      options,
      depth + 1,
    );
    return;
  }

  // --- The new child is an ElementDeclaration ---
  // --- The previous child is an Element ---

  // From this point on, we're no longer replacing the child node.
  // Instead, we're updating the previous child node to match the new child node.
  logger.log?.("updating the previous child node to match the new child node");

  const declaration = nextChild as unknown as ElementDeclaration<
    AnyProps,
    SingularElement
  >;

  // A ref handler may change between updates,
  // so it should be called again to ensure that the ref up-to-date.
  // Ref's should be called before setting props.
  if (nextChild.ref) {
    // We're assuming that ref handlers are idempotent.
    // The provide `Reference` implementation is idempotent,
    // so it's a safe assumption to make.
    normalizeElementDeclarationRef(nextChild.ref)?.next(prevChild);

    const prevRef = getElementDeclaration(prevChild)?.ref;

    if (nextChild.ref !== prevRef) {
      normalizeElementDeclarationRef(prevRef)?.next(null);
    }
  }

  const prevDeclaration = getElementDeclaration(prevChild);

  if (isElementDeclaration.Markup(declaration)) {
    await updateSingularElementWithMarkup(
      prevChild,
      declaration,
      prevDeclaration,
      options,
    );
  } else if (isElementDeclaration.DOM(declaration)) {
    await updateSingularElementWithDom(
      prevChild,
      declaration,
      prevDeclaration,
      options,
    );
  } else {
    throw new Error("Unknown element type");
  }

  // TODO: Remove in production
  // logger.timeEnd?.(timeId);

  attachElementDeclaration<SingularElement>(prevChild, declaration);

  if (shouldRecognizeChildren(nextChild, prevChild)) {
    await updateDomElementChildren(
      prevChild,
      await flattenElement(
        createFragmentDeclaration(nextChild.children),
        optionsWithDocument,
      ),
      options,
      depth + 1,
    );
  }
}

function assertReplacementState(
  parent: UpdatableParentNode,
  nextNode: BuildChildResult,
  prevNode: ChildNode,
) {
  if (isDocumentFragment(nextNode)) {
    // This should never happen, but it's a good sanity check.
    throw new Error(
      "Fragment should not be returned from build. Fragments should have been flattened at this point.",
    );
  }

  if (prevNode.parentNode !== parent) {
    // This should never happen, but it's a good sanity check.
    throw new Error("Target parent mismatch.");
  }
}

/**
 * Replaces a child node while preserving and updating its children.
 *
 * @remarks
 *
 * Use this when the child node itself needs to be replaced, but its children
 * should remain and be updated in place. This is useful for container elements
 * where the structure of the children should be preserved.
 */
async function replaceContainingElement(
  parent: UpdatableParentNode,
  nextChild: ElementDeclaration.Singular,
  prevNode: SingularElement,
  options: UpdateOptions,
  depth = 0,
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };
  const logger = options.logger ?? {};

  const prevChildren = prevNode.childNodes;
  const nextChildWithoutChildren = {
    ...nextChild,
    children: [],
  } satisfies ElementDeclaration.Singular;

  const nextNode = await buildChild(
    nextChildWithoutChildren,
    optionsWithDocument,
  );

  // TODO: Remove in production
  assertReplacementState(parent, nextNode, prevNode);

  // Update the ref to point to the new node.
  normalizeElementDeclarationRef(nextChild.ref)?.next(nextNode);

  // Move all children from the previous node to the new node.
  appendAllChildren(nextNode, prevChildren);

  await updateDomElementChildren(
    nextNode,
    await flattenElement(
      createFragmentDeclaration(nextChild.children),
      optionsWithDocument,
    ),
    options,
    depth + 1,
  );

  // `replaceWith` can be up to 25% faster than `replaceChild`
  prevNode.replaceWith(nextNode);
}

/**
 * Replaces a child node and all of its children with a new child node.
 *
 * @remarks
 *
 * This should only be used when it has been determined that the child node
 * and its children should be replaced with a new child node in its entirety.
 */
async function replaceSubtree(
  parent: UpdatableParentNode,
  nextChild: FlattenedElementDeclarationChild,
  prevNode: ChildNode,
  options: UpdateOptions,
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };
  const logger = options.logger ?? {};

  logger.log?.("replaceSubtree", { nextChild, prevNode });

  const nextNode = await buildChild(nextChild, optionsWithDocument);

  // TODO: Remove in production
  assertReplacementState(parent, nextNode, prevNode);

  if (nextNode === prevNode) {
    // If the new element is the same as the old element,
    // then there's no need to replace it, just update the latest child.
    // This should only happen when the new element is an `Element` node
    // that was created outside of the renderer.
    return;
  }

  if (isElementDeclaration(nextChild)) {
    // Update the ref to point to the new node.
    normalizeElementDeclarationRef(nextChild.ref)?.next(nextNode);
  }

  // `replaceWith` can be up to 25% faster than `replaceChild`
  prevNode.replaceWith(nextNode);
}

/**
 * Update the children of a parent element with the given declaration.
 *
 * @example
 *
 * ```ts
 * import { dom, update } from "knyt";
 *
 * const rootEl = document.getElementById("root");
 *
 * await update(rootEl, dom.div.$("Hello, World!"));
 * ```
 */
export async function update(
  parent: UpdatableParentNode,
  input: KnytDeclaration,
  options: UpdateOptions = {},
): Promise<void> {
  const $document = options.document ?? parent.ownerDocument;
  const optionsWithDocument = { ...options, document: $document };

  await updateDomElementChildren(
    parent,
    await flattenElement(input, optionsWithDocument),
    options,
  );
}

function areListenersEqual<E extends AnyProps = AnyProps>(
  prevListener: ListenerDeclaration<E> | undefined,
  nextListener: ListenerDeclaration<E> | undefined,
): boolean {
  if (prevListener === nextListener) {
    return true;
  }

  if (!prevListener || !nextListener) {
    return false;
  }

  if (
    prevListener.type === nextListener.type ||
    prevListener.handler === nextListener.handler ||
    shallowEqual(prevListener.options, nextListener.options)
  ) {
    return true;
  }

  return false;
}
