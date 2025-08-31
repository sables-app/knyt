---
"@knyt/clerk": minor
"@knyt/artisan": patch
---

- Add `Reference.ToValue<T>` type to `@knyt/artisan` to extract the value type from a `Reference<T>`.
- Revise `@knyt/clerk` data selection APIs.
  - Add `createAccessor()` utility to create data accessors for any `Reference<T>`.
  - Add `.createAccessor()` method to `Store<T>` instances to create accessors for the store's data.
  - Add `.selectors` property to `Store<T>` instances to dynamically create selectors for the store's data.
  - Reorganize all reducers utilities under a single `reducer` namespace.
  - Deprecate `defineSelector()` method.
  - Deprecate `propertySelector()` method.
  - Deprecate `ref()` method.
