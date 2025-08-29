---
"@knyt/luthier": minor
---

Add support for server-side concurrent rendering using the `defer()` controller. Now the same component logic can be used on both client and server, with proper handling of async data fetching and rendering.

This is currently considered a low-level API. Additional utility functions/controllers will be added in future releases to facilitate common server-side rendering -> hydration -> client-side rendering workflows.
