/**
 * Tells any open dashboard tab that the email was just verified, so the
 * "verify your email" banner disappears without a reload. Uses
 * BroadcastChannel because the link is usually opened in a new tab.
 */
const CHANNEL = "topnotchlogs-email-verified";

export function notifyEmailVerified() {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage("verified");
    channel.close();
  } catch {
    // BroadcastChannel unsupported: other tabs pick it up on next focus.
  }
}

export function onEmailVerified(callback: () => void): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => callback();
    return () => channel.close();
  } catch {
    return () => {};
  }
}
