/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button | MDN reference}.
 */
export enum MouseButton {
  /** Main button pressed, usually the left button or the un-initialized state */
  Main = 0,
  /** Auxiliary button pressed, usually the wheel button or the middle button (if present) */
  Auxiliary = 1,
  /** Secondary button pressed, usually the right button */
  Secondary = 2,
  /** Fourth button, typically the Browser Back button */
  Fourth = 3,
  /** Fifth button, typically the Browser Forward button */
  Fifth = 4,
}
