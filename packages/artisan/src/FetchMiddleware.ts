import { MiddlewareRunner } from "./MiddlewareRunner.ts";

const defaultFinalHandler: FetchMiddleware.FinalHandler<unknown> = ([
  ,
  response,
]) => {
  return response ?? new Response("Not Found", { status: 404 });
};

/**
 * A middleware runner specialized for handling fetch events,
 * allowing middleware to process and modify request-response pairs.
 */
export class FetchMiddleware<TRequest = Request> {
  #finalHandler: FetchMiddleware.FinalHandler<TRequest>;

  #runner = new MiddlewareRunner<{
    fetch: (
      pair: FetchMiddleware.RequestResponsePair<TRequest>,
    ) =>
      | FetchMiddleware.RequestResponsePair<TRequest>
      | Promise<FetchMiddleware.RequestResponsePair<TRequest>>;
  }>();

  constructor(finalHandler?: FetchMiddleware.FinalHandler<TRequest>) {
    this.#finalHandler = finalHandler ?? defaultFinalHandler;
  }

  /**
   * Add a handler that processes the request-response pair.
   */
  use(handler: FetchMiddleware.Handler<TRequest>) {
    this.#runner.add("fetch", async (pair) => {
      const result = await handler(pair);

      if (result instanceof Response) {
        const [request] = pair;

        return [request, result];
      }

      return result ?? pair;
    });
  }

  /**
   * Add a fetch handler that only processes the request,
   * if no response already exists.
   */
  useFetchHandler(handler: FetchMiddleware.FetchHandler<TRequest>) {
    this.use(async ([request, response]) => {
      // If a response already exists, skip this handler.
      if (response) return [request, response];

      return [request, await handler(request)];
    });
  }

  /**
   * Process a request and optional response through the middleware
   * chain, returning the final request-response pair.
   */
  async run(
    request: TRequest,
    response?: Response,
  ): Promise<FetchMiddleware.RequestResponsePair<TRequest>> {
    return this.#runner.chain("fetch", [request, response]);
  }

  /**
   * Process a request through the middleware chain and final handler,
   * always returning a `Response`.
   *
   * @detachable
   */
  readonly fetch = async (request: TRequest): Promise<Response> => {
    return this.#finalHandler(await this.run(request));
  };
}

export namespace FetchMiddleware {
  /**
   * A tuple representing a request and an optional response.
   */
  export type RequestResponsePair<TRequest> = [
    request: TRequest,
    response: Response | undefined,
  ];

  /**
   * A handler that takes a request-response pair,
   * and can return a modified pair, a response, or nothing.
   */
  export type Handler<TRequest> = (
    pair: RequestResponsePair<TRequest>,
  ) =>
    | RequestResponsePair<TRequest>
    | undefined
    | Response
    | Promise<RequestResponsePair<TRequest> | undefined | Response>;

  /**
   * The final handler that processes the request-response pair
   * after all middleware has run. This handler must return a `Response`.
   */
  export type FinalHandler<TRequest> = (
    pair: RequestResponsePair<TRequest>,
  ) => Response | Promise<Response>;

  /**
   * A handler that takes a request and optionally returns a response.
   */
  export type FetchHandler<TRequest> = (
    request: TRequest,
  ) => Response | undefined | Promise<Response | undefined>;
}
