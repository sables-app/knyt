# @knyt/clerk

## 0.1.0

### Minor Changes

- d68f71c: - Add `Reference.ToValue<T>` type to `@knyt/artisan` to extract the value type from a `Reference<T>`.
  - Revise `@knyt/clerk` data selection APIs.
    - Add `createAccessor()` utility to create data accessors for any `Reference<T>`.
    - Add `.createAccessor()` method to `Store<T>` instances to create accessors for the store's data.
    - Add `.selectors` property to `Store<T>` instances to dynamically create selectors for the store's data.
    - Reorganize all reducers utilities under a single `reducer` namespace.
    - Deprecate `defineSelector()` method.
    - Deprecate `propertySelector()` method.
    - Deprecate `ref()` method.
- 816386a: Rename all reducers to clarity and consistency.
- 322a223: - Add `select` utility to remove dependency on `reselect`.
  - Remove unused `event-station` dependency from `@knyt/clerk`.
- a84cd78: Rename reducers and selectors for clarity.

### Patch Changes

- Updated dependencies [d68f71c]
- Updated dependencies [01befa5]
- Updated dependencies [fa83e20]
- Updated dependencies [0287e64]
- Updated dependencies [0f62709]
- Updated dependencies [5e4d5af]
- Updated dependencies [37211b0]
- Updated dependencies [3c6a422]
- Updated dependencies [d153558]
  - @knyt/artisan@0.1.0

## 0.1.0-alpha.7

### Minor Changes

- d68f71c: - Add `Reference.ToValue<T>` type to `@knyt/artisan` to extract the value type from a `Reference<T>`.
  - Revise `@knyt/clerk` data selection APIs.
    - Add `createAccessor()` utility to create data accessors for any `Reference<T>`.
    - Add `.createAccessor()` method to `Store<T>` instances to create accessors for the store's data.
    - Add `.selectors` property to `Store<T>` instances to dynamically create selectors for the store's data.
    - Reorganize all reducers utilities under a single `reducer` namespace.
    - Deprecate `defineSelector()` method.
    - Deprecate `propertySelector()` method.
    - Deprecate `ref()` method.
- 322a223: - Add `select` utility to remove dependency on `reselect`.
  - Remove unused `event-station` dependency from `@knyt/clerk`.

### Patch Changes

- Updated dependencies [d68f71c]
- Updated dependencies [37211b0]
  - @knyt/artisan@0.1.0-alpha.7
