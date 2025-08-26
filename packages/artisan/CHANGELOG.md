# @knyt/artisan

## 0.1.0-alpha.4

### Minor Changes

- 0f62709: Update `ObservablePromise` to resolve the promise with the first emitted value by default.

## 0.1.0-alpha.2

### Minor Changes

- 5e4d5af: Renamed `MiddlewareRunner` methods to be more concise and intuitive:
  - `addMiddleware` -> `add`
  - `removeMiddleware` -> `remove`
  - `hasMiddleware` -> `has`
- 3c6a422: Add `FetchMiddleware` utility

### Patch Changes

- fa83e20: Correct `unwrapSubscriber` input type

## 0.1.0-alpha.1

### Minor Changes

- 01befa5: Add the `DynamicObserver` utility; an observer that dynamically updates its current subscriber based on the latest value emitted by an observable.
