---
"@knyt/glazier": patch
---

Fix type compatibility for `AnyRequest` to support both `Request` and `BunRequest`, preventing conflicts with global `Request` types from other dependencies.
