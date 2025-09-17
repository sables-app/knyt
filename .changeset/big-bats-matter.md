---
"@knyt/luthier": patch
"@knyt/tasker": patch
---

Enable management of adopted style sheets
- add `hasStyleSheet` and `clearStyleSheets` methods
- General clean up / refactoring
- Prevent a potential bug if style sheet inputs return new a `CSSStyleSheet` instance every time they're normalized.
