/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { createTheatreStore } from "./createTheatreStore.ts";

describe("createTheatreStore", () => {
  let theatre: ReturnType<typeof createTheatreStore>;

  beforeEach(() => {
    theatre = createTheatreStore();
  });

  it("should start with zero attendees and no error", () => {
    expect(theatre.accessor.itemCount).toBe(0);
    expect(theatre.accessor.latestError).toBeUndefined();
  });

  it("should register a unique attendee", () => {
    theatre.actions.register("Alice");

    expect(theatre.accessor.itemCount).toBe(1);
    expect(theatre.accessor.latestError).toBeUndefined();
  });

  it("should not register a duplicate attendee and set error", () => {
    theatre.actions.register("Bob");
    theatre.actions.register("Bob");

    expect(theatre.accessor.itemCount).toBe(1);
    expect(theatre.accessor.latestError).toBeInstanceOf(Error);
    expect(theatre.accessor.latestError?.message).toMatch(/already exists/);
  });

  it("should clear error with dismissError", () => {
    theatre.actions.register("Bob");
    theatre.actions.register("Bob");

    expect(theatre.accessor.latestError).toBeTruthy();

    theatre.actions.dismissError();

    expect(theatre.accessor.latestError).toBeUndefined();
  });

  it("should unregister an existing attendee", () => {
    theatre.actions.register("Charlie");

    expect(theatre.accessor.itemCount).toBe(1);

    theatre.actions.unregister("Charlie");

    expect(theatre.accessor.itemCount).toBe(0);
    expect(theatre.accessor.latestError).toBeUndefined();
  });

  it("should set error when unregistering a non-existent attendee", () => {
    expect(theatre.accessor.latestError).toBeUndefined();

    theatre.actions.unregister("NonExistent");

    expect(theatre.accessor.latestError).toBeInstanceOf(Error);
    expect(theatre.accessor.latestError?.message).toMatch(/does not exist/);
  });

  it("should allow registering with an error present", () => {
    expect(theatre.accessor.latestError).toBeUndefined();

    theatre.actions.register("Dana");
    theatre.actions.register("Dana");

    expect(theatre.accessor.itemCount).toBe(1);
    expect(theatre.accessor.latestError).toBeInstanceOf(Error);

    theatre.actions.register("Eve");

    expect(theatre.accessor.itemCount).toBe(2);
    expect(theatre.accessor.latestError).toBeInstanceOf(Error);
  });
});
