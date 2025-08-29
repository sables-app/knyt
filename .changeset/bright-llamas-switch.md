---
"@knyt/luthier": minor
"@knyt/tasker": minor
---

### Changed

- All lifecycle hooks are now called asynchronously.
- Property change events are emitted before requesting an update on the host element.

### Removed

- The `hostUpdate` lifecycle hook.

### Renamed

- `hostBeforeUpdate` is now `hostUpdateRequested` for improved accuracy.
- `LifecycleDelegate.hostUpdated` is now `LifecycleDelegate.hostAfterUpdate` to avoid confusion with `ReactiveController.hostUpdated`.

### Added

- New `hostBeforeUpdate` lifecycle hook.
