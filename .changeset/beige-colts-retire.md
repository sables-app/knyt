---
"@knyt/artisan": patch
---

Improve `Reference` implementation to emit change notifications in a more expected manner.

- Updated behavior with `Reference`s to avoid notifying subscribers multiple times for the same change.
- Fix an issue with `Reference`s where multiple synchronous changes would lead to emitting duplicate notifications to subscribers.
