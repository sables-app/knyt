import type { EventHandler } from "@knyt/weaver";

import type { ReactiveController, ReactiveControllerHost } from "./ReactiveController";

export class HotkeyController<K> implements ReactiveController {
  #host: ReactiveControllerHost;
  #hotkeys: Map<K, HotkeyController.HotkeyDefinition>;
  #onHotkey: (hotkeyName: K) => void;

  constructor(
    host: ReactiveControllerHost,
    {
      hotkeys,
      onHotkey,
    }: {
      hotkeys: Map<K, HotkeyController.HotkeyDefinition>;
      onHotkey: (hotkeyName: K) => void;
    },
  ) {
    this.#host = host;
    this.#hotkeys = hotkeys;
    this.#onHotkey = onHotkey;

    host.addController(this);
  }

  hostConnected?: () => void;

  readonly handleKeyDown: EventHandler.Keyboard<HTMLElement> = (keyDown) => {
    if (keyDown.repeat) return;

    const entries: [K, HotkeyController.HotkeyDefinition][] = Array.from(
      this.#hotkeys.entries(),
    );
    const activatedHotkey = entries.find(
      ([hotkeyName, hotkey]) =>
        hotkey.code === keyDown.code &&
        hotkey.modifiers.every((modifier) => keyDown[modifier]),
    );

    if (!activatedHotkey) return;

    keyDown.preventDefault();
    keyDown.stopPropagation();

    const [hotkeyName] = activatedHotkey;

    this.#onHotkey(hotkeyName);
  };
}

export namespace HotkeyController {
  export type HotkeyDefinition = {
    code: string;
    modifiers: Array<"ctrlKey" | "shiftKey" | "altKey" | "metaKey">;
  };
}
