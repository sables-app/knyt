---
"@knyt/glazier": patch
---

Resolve an issue where the `<knyt-frontmatter>` tag was not handled in the proper sequence, resulting in the frontmatter being overlooked in certain scenarios. This update guarantees that the frontmatter is always processed first, ensuring it is accurately parsed and used by the application.
