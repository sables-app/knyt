/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { FetchMiddleware } from "../FetchMiddleware.ts";

describe("FetchMiddleware", () => {
  describe("fetch", () => {
    it("returns 404 Not Found by default", async () => {
      const middleware = new FetchMiddleware();
      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
    });

    it("runs a middleware that sets a response", async () => {
      const middleware = new FetchMiddleware();

      middleware.use(([req]) => [req, new Response("Hello", { status: 200 })]);

      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Hello");
    });

    it("runs multiple middleware in order", async () => {
      const middleware = new FetchMiddleware();

      middleware.use(([req]) => [req, new Response("First", { status: 201 })]);
      middleware.use(([req, res]) => [
        req,
        new Response((res ? res.status : "") + " Second", { status: 202 }),
      ]);

      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(202);
      expect(await res.text()).toContain("201 Second");
    });

    it("skips fetch handler if response exists", async () => {
      const middleware = new FetchMiddleware();

      middleware.use(([req]) => [req, new Response("Set", { status: 200 })]);
      middleware.useFetchHandler(
        () => new Response("Should not run", { status: 500 }),
      );

      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Set");
    });

    it("runs fetch handler if no response exists", async () => {
      const middleware = new FetchMiddleware();

      middleware.useFetchHandler(
        () => new Response("FetchHandler", { status: 201 }),
      );

      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(201);
      expect(await res.text()).toBe("FetchHandler");
    });

    it("supports async middleware", async () => {
      const middleware = new FetchMiddleware();

      middleware.use(async ([req]) => {
        await Promise.resolve();

        return [req, new Response("Async", { status: 202 })];
      });

      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(202);
      expect(await res.text()).toBe("Async");
    });

    it("finalHandler can be customized", async () => {
      const middleware = new FetchMiddleware(
        () => new Response("Custom", { status: 418 }),
      );
      const req = new Request("https://example.com");
      const res = await middleware.fetch(req);

      expect(res.status).toBe(418);
      expect(await res.text()).toBe("Custom");
    });
  });

  describe("run", () => {
    it("returns the request-response pair", async () => {
      const middleware = new FetchMiddleware();
      const req = new Request("https://example.com");
      const pair = await middleware.run(req);

      expect(pair[0]).toBe(req);
      expect(pair[1]).toBeUndefined();
    });

    it("passes response through middleware chain", async () => {
      const middleware = new FetchMiddleware();

      middleware.use(([req, res]) => [
        req,
        res ? new Response("Changed", { status: 201 }) : undefined,
      ]);

      const req = new Request("https://example.com");
      const pair = await middleware.run(
        req,
        new Response("Original", { status: 200 }),
      );

      expect(pair[1]).toBeInstanceOf(Response);
      expect(pair[1] && (await pair[1].text())).toBe("Changed");
      expect(pair[1] && pair[1].status).toBe(201);
    });
  });
});
