# @knyt/artisan

## 0.1.0-alpha.7

### Minor Changes

- 37211b0: - Remove `memoizeSingleArgument` function
  - Add `memoize` function for function with any number of arguments

### Patch Changes

- d68f71c: - Add `Reference.ToValue<T>` type to `@knyt/artisan` to extract the value type from a `Reference<T>`.
  - Revise `@knyt/clerk` data selection APIs.
    - Add `createAccessor()` utility to create data accessors for any `Reference<T>`.
    - Add `.createAccessor()` method to `Store<T>` instances to create accessors for the store's data.
    - Add `.selectors` property to `Store<T>` instances to dynamically create selectors for the store's data.
    - Reorganize all reducers utilities under a single `reducer` namespace.
    - Deprecate `defineSelector()` method.
    - Deprecate `propertySelector()` method.
    - Deprecate `ref()` method.

## 0.1.0-alpha.5

### Minor Changes

- 0287e64: Add `fallbackRef` utility function. A convenience function that creates a reference which falls back to a specified value
  when the source reference's value is `null` or `undefined`.
- d153558: - Add `refToPromise` utility to convert a `Reference` to a `Promise`.

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
