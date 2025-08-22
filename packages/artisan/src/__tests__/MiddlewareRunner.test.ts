/// <reference types="bun-types" />

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  type Mock,
} from "bun:test";

import { MiddlewareRunner } from "../MiddlewareRunner";

type B = {
  test: (value: number) => Promise<number>;
  other: (value: string) => Promise<string>;
};

describe("MiddlewareRunner", () => {
  let consoleWarn: typeof console.warn;

  beforeAll(() => {
    consoleWarn = console.warn;
    console.warn = mock();
  });

  beforeEach(() => {
    (console.warn as Mock<any>).mockClear();
  });

  afterAll(() => {
    console.warn = consoleWarn;
  });

  describe("add", () => {
    it("should add middleware and verify its existence", () => {
      const runner = new MiddlewareRunner<B>();
      const middleware = mock();

      runner.add("test", middleware);

      expect(runner.has("test", middleware)).toBe(true);
      expect(runner.length).toBe(1);
    });

    it("should not add duplicate middleware", () => {
      const runner = new MiddlewareRunner<B>();
      const middleware = mock();

      runner.add("test", middleware);
      runner.add("test", middleware);

      expect(runner.has("test", middleware)).toBe(true);
      expect(runner.length).toBe(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("remove", () => {
    it("should remove middleware", () => {
      const runner = new MiddlewareRunner<B>();
      const middleware = mock();

      runner.add("test", middleware);
      runner.remove("test", middleware);

      expect(runner.has("test", middleware)).toBe(false);
      expect(runner.length).toBe(0);
    });
  });

  describe("forEach", () => {
    it("should execute middleware of a specific kind using forEach", async () => {
      const runner = new MiddlewareRunner<B>();
      const middleware = mock();

      runner.add("test", middleware);

      await runner.forEach("test", async (mw) => {
        await mw(9001);
      });

      expect(middleware).toHaveBeenCalledTimes(1);
    });

    it("should not execute middleware of a different kind using forEach", async () => {
      const runner = new MiddlewareRunner<B>();
      const middleware = mock();

      runner.add("test", middleware);

      await runner.forEach("other", async (mw) => {
        await mw("Hello");
      });

      expect(middleware).not.toHaveBeenCalled();
    });
  });

  describe("chain", () => {
    it("should chain middleware and return the final result", async () => {
      const runner = new MiddlewareRunner<B>();
      const middleware1 = mock(async (value: number) => value + 1);
      const middleware2 = mock(async (value: number) => value * 2);

      runner.add("test", middleware1);
      runner.add("test", middleware2);

      const result = await runner.chain("test", 1);

      expect(result).toBe(4); // (1 + 1) * 2
      expect(middleware1).toHaveBeenCalledWith(1);
      expect(middleware2).toHaveBeenCalledWith(2);
    });

    it("should handle empty middleware list gracefully", async () => {
      const runner = new MiddlewareRunner<B>();

      const result = await runner.chain("test", 1);

      expect(result).toBe(1);
    });
  });

  describe("[Symbol.iterator]", () => {
    it("should iterate over middleware", async () => {
      const runner = new MiddlewareRunner<B>();
      const middleware1 = mock();
      const middleware2 = mock();

      runner.add("test", middleware1);
      runner.add("other", middleware2);

      const middlewares = Array.from(runner);

      expect(middlewares).toHaveLength(2);
      expect(middlewares[0]).toEqual(["test", middleware1]);
      expect(middlewares[1]).toEqual(["other", middleware2]);
    });
  });
});
