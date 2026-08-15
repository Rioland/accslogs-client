/**
 * Wallet balance change notifications (client-side).
 *
 * The balance is rendered by the Sidebar, but it is spent and refunded by pages
 * that do not own it. Rather than lifting state or prop-drilling a setter into
 * every purchase flow, a purchase broadcasts that the balance moved and the
 * Sidebar re-reads it.
 *
 * The new balance is passed along when the API returned one, so the number
 * updates instantly instead of waiting for a round trip.
 */

export const FUNDS_CHANGED_EVENT = "wallet:funds-changed";

export function notifyFundsChanged(newBalance?: number | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ balance: number | null }>(FUNDS_CHANGED_EVENT, {
      detail: { balance: typeof newBalance === "number" ? newBalance : null },
    }),
  );
}

export function onFundsChanged(
  handler: (balance: number | null) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    handler((e as CustomEvent<{ balance: number | null }>).detail?.balance ?? null);
  };
  window.addEventListener(FUNDS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(FUNDS_CHANGED_EVENT, listener);
}
