import type { Subscription } from "./types.ts";

/**
 * A registry for managing subscriptions.
 *
 * @remarks
 *
 * This is a simple set that allows for managing multiple subscriptions at once.
 *
 * This is also useful for maintaining references to observer retaining subscriptions
 * without needing to manage them manually.
 *
 * @public
 */
export class SubscriptionRegistry extends Set<Subscription> {
  /**
   * Unsubscribes all subscriptions.
   */
  unsubscribeAll(): void {
    if (this.size === 0) return;

    const subscriptions = Array.from(this);

    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }
  }
}
