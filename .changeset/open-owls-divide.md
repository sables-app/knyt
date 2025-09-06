---
"@knyt/glazier": patch
---

Add detection for unexpected imports when bundling client-side code. This helps prevent runtime errors due to server-only modules being included in client bundles, and possible security issues from exposing server code to the client.
