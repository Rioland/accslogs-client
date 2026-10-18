/**
 * Settling a one-time verification: deciding, with the provider's help,
 * whether the customer got their code (complete) or not (cancel + refund).
 *
 * Every path that can end a verification — the customer cancelling, the
 * browser countdown running out, the SMS poll noticing the window has passed,
 * the history load and the scheduled sweep — goes through settleVerification,
 * so the rules live in one place:
 *
 *   1. A code that reached the line is the customer's. If the provider says
 *      the verification completed, or any message is sitting on it, the row is
 *      completed, never refunded.
 *   2. When the customer cancels a number that has no code, they are refunded
 *      straight away; releasing the line upstream is best effort (see
 *      cancelForCustomer).
 *   3. Automatic endings (timeout, poll, sweep) only refund once the line is
 *      dead upstream: cancelled by us, or already ended by the provider
 *      without a code. If that can't be confirmed (provider unreachable,
 *      unexpected error), nothing changes and the caller retries later.
 *
 * Server-only: uses the service-role client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TV_STATE,
  TextVerifiedError,
  cancelVerification,
  extractSmsFields,
  getVerification,
  listSms,
  sortSmsNewestFirst,
  type TvSms,
} from "@/lib/textverified";

export type SettleRow = {
  id: number;
  request_id: string;
  provider_id: string | null;
  status: string;
  created_at: string;
  ends_at?: string | null;
  sms_code?: string | null;
  sms_content?: string | null;
};

export const SETTLE_COLUMNS =
  "id, request_id, provider_id, status, created_at, ends_at, sms_code, sms_content";

export type SettleOutcome =
  | { outcome: "completed"; code: string | null; content: string | null }
  | { outcome: "refunded"; refunded: number | null }
  /** Already finished in a state that involves no money (failed/cancelled). */
  | { outcome: "unchanged"; status: string }
  /** Could not decide safely; nothing was changed. */
  | { outcome: "retry"; message: string };

/** Provider states in which the line ended without delivering a code. */
const ENDED_WITHOUT_CODE = new Set<string>([
  TV_STATE.canceled,
  TV_STATE.timedOut,
  TV_STATE.refunded,
  TV_STATE.reported,
]);

/**
 * Reuse and reactivate are only offered after a code arrived, so a line in
 * either state delivered one.
 */
const DELIVERED = new Set<string>([
  TV_STATE.completed,
  TV_STATE.reused,
  TV_STATE.reactivated,
]);

/**
 * A row without a provider id is mid-purchase: the create route debits first
 * and records the number seconds later. Only treat it as abandoned once it is
 * clearly older than any purchase could take.
 */
const PENDING_ABANDONED_MS = 10 * 60_000;

const RETRY_MESSAGE =
  "Couldn't confirm this number with the provider. Your money is safe — please try again in a moment.";

async function readState(providerId: string): Promise<string | null> {
  try {
    const details = await getVerification(providerId);
    return String(details.state || "") || null;
  } catch (err) {
    console.warn(`[textverify/settle] could not read state of ${providerId}`, err);
    return null;
  }
}

/** Newest message on the line, null if none, undefined if the lookup failed. */
async function readLatestSms(providerId: string): Promise<TvSms | null | undefined> {
  try {
    const messages = sortSmsNewestFirst(await listSms({ reservationId: providerId }));
    return messages[0] ?? null;
  } catch (err) {
    console.warn(`[textverify/settle] could not list SMS for ${providerId}`, err);
    return undefined;
  }
}

async function readRow(admin: SupabaseClient, id: number): Promise<SettleRow | null> {
  const { data } = await admin
    .from("text_verifications")
    .select(SETTLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as SettleRow | null) ?? null;
}

/** Map a row that is already final to its outcome. */
function outcomeOfFinalRow(row: SettleRow): SettleOutcome | null {
  if (row.status === "completed") {
    return {
      outcome: "completed",
      code: row.sms_code ?? null,
      content: row.sms_content ?? null,
    };
  }
  if (row.status === "refunded") return { outcome: "refunded", refunded: null };
  if (row.status === "failed" || row.status === "cancelled") {
    return { outcome: "unchanged", status: row.status };
  }
  return null;
}

async function complete(
  admin: SupabaseClient,
  row: SettleRow,
  sms: TvSms | null,
): Promise<SettleOutcome> {
  const fields = sms ? extractSmsFields(sms) : { code: null, content: null };
  const { error } = await admin.rpc("text_verification_complete_by_provider", {
    p_provider_id: row.provider_id,
    p_sms_code: fields.code,
    p_sms_content: fields.content,
    p_provider_response: sms as unknown as Record<string, unknown> | null,
  });
  if (error) throw error;

  // The RPC is a no-op if the row was refunded a moment earlier by another
  // path; report what the row actually says.
  const fresh = await readRow(admin, row.id);
  return (fresh && outcomeOfFinalRow(fresh)) || {
    outcome: "completed",
    code: fields.code,
    content: fields.content,
  };
}

async function refund(
  admin: SupabaseClient,
  row: SettleRow,
  reason: string,
): Promise<SettleOutcome> {
  const { data, error } = await admin.rpc("text_verification_fail_and_refund", {
    p_request_id: row.request_id,
    p_error_message: reason,
    p_provider_response: null,
  });
  if (error) throw error;

  if (data?.success) {
    return { outcome: "refunded", refunded: Number(data.refunded ?? 0) || null };
  }

  // Lost a race with the webhook or another settle — report where it landed.
  const fresh = await readRow(admin, row.id);
  return (fresh && outcomeOfFinalRow(fresh)) || { outcome: "retry", message: RETRY_MESSAGE };
}

export type SettleOptions = {
  /**
   * The customer pressed cancel. They must be able to stop waiting at any
   * point before a code arrives, without the number sitting "active" until
   * the provider's 5–15 minute window runs out.
   */
  customerCancel?: boolean;
};

export async function settleVerification(
  admin: SupabaseClient,
  row: SettleRow,
  reason: string,
  opts: SettleOptions = {},
): Promise<SettleOutcome> {
  const final = outcomeOfFinalRow(row);
  if (final) return final;

  if (!row.provider_id) {
    const age = Date.now() - new Date(row.created_at).getTime();
    if (!(age > PENDING_ABANDONED_MS)) {
      return { outcome: "retry", message: "This number is still being set up. Please wait a moment." };
    }
    // Never reached the provider: nothing was bought upstream.
    return refund(admin, row, reason);
  }

  const [state, sms] = await Promise.all([
    readState(row.provider_id),
    readLatestSms(row.provider_id),
  ]);

  if (sms || (state && DELIVERED.has(state))) {
    return complete(admin, row, sms ?? null);
  }

  if (state && ENDED_WITHOUT_CODE.has(state)) {
    return refund(admin, row, reason);
  }

  if (opts.customerCancel) {
    return cancelForCustomer(admin, row, reason);
  }

  // Neither the state nor the inbox could be read: no basis for a decision.
  if (state === null && sms === undefined) {
    return { outcome: "retry", message: RETRY_MESSAGE };
  }

  if (state !== null && state !== TV_STATE.pending) {
    console.warn(
      `[textverify/settle] ${row.request_id} has unrecognised provider state "${state}" — leaving it`,
    );
    return { outcome: "retry", message: RETRY_MESSAGE };
  }

  // Still live (or state unknown): it has to be cancelled before refunding.
  try {
    await cancelVerification(row.provider_id);
    return refund(admin, row, reason);
  } catch (err) {
    const cannotCancel =
      err instanceof TextVerifiedError && err.code === "cannot_cancel";
    if (!cannotCancel) {
      console.error(`[textverify/settle] cancel failed for ${row.request_id}`, err);
      return { outcome: "retry", message: RETRY_MESSAGE };
    }
  }

  // The provider refused the cancel. That is normal right at the end of the
  // window, but it also happens if a code landed in the last second — look
  // again before deciding.
  const [after, lateSms] = await Promise.all([
    readState(row.provider_id),
    readLatestSms(row.provider_id),
  ]);
  if (lateSms || (after && DELIVERED.has(after))) {
    return complete(admin, row, lateSms ?? null);
  }
  if (after && ENDED_WITHOUT_CODE.has(after)) {
    return refund(admin, row, reason);
  }
  return { outcome: "retry", message: RETRY_MESSAGE };
}

/**
 * The customer cancelled a number that has not delivered a code.
 *
 * Refund now, whatever the provider says about the cancel. That is safe
 * because:
 *   - a code only ever reaches the customer through this row (webhook or
 *     poll), and a delivered code completes the row first — so an active row
 *     means the customer has received nothing;
 *   - TextVerified only bills a verification when a message arrives, so a
 *     line that stays silent costs nothing even if it lingers upstream.
 *
 * Releasing the line upstream is still attempted, so it stops accepting
 * messages. If the provider refuses (some lines can't be cancelled straight
 * away) or can't be reached, the line simply times out on its own. The one
 * cost is a code landing on it in the meantime: the provider bills us, the
 * webhook logs it, and the customer keeps their refund.
 */
async function cancelForCustomer(
  admin: SupabaseClient,
  row: SettleRow,
  reason: string,
): Promise<SettleOutcome> {
  const providerId = row.provider_id as string;
  let released = true;
  try {
    await cancelVerification(providerId);
  } catch (err) {
    released = false;
    const refused = err instanceof TextVerifiedError && err.code === "cannot_cancel";
    console[refused ? "info" : "warn"](
      `[textverify/settle] ${row.request_id}: provider ${refused ? "refused" : "failed"} the cancel — refunding anyway, line will expire upstream`,
      refused ? "" : err,
    );
  }

  if (!released) {
    // A refused cancel can mean a code landed a moment ago. If it is there,
    // the customer gets it instead of a refund.
    const lateSms = await readLatestSms(providerId);
    if (lateSms) return complete(admin, row, lateSms);
  }

  return refund(
    admin,
    row,
    released ? reason : `${reason} (left to expire at provider)`,
  );
}

/* ------------------------------------------------------------------ */
/*  Finding verifications nobody settled                               */
/* ------------------------------------------------------------------ */

/** Past its window by this much before a background settle touches it. */
const STALE_GRACE_MS = 60_000;
/** Used when the provider gave no expiry. Verification windows are minutes. */
const NO_EXPIRY_STALE_MS = 30 * 60_000;

/**
 * Verifications whose window has closed without being settled — the customer
 * closed the tab, lost connection, or the old code marked them "expired"
 * without refunding.
 */
export async function findStaleVerifications(
  admin: SupabaseClient,
  opts: { userId?: string; limit: number },
): Promise<SettleRow[]> {
  const now = Date.now();
  let query = admin
    .from("text_verifications")
    .select(SETTLE_COLUMNS)
    .in("status", ["pending", "active", "expired"])
    .lt("created_at", new Date(now - STALE_GRACE_MS).toISOString())
    .order("created_at", { ascending: true })
    .limit(Math.max(opts.limit * 4, 20));

  if (opts.userId) query = query.eq("user_id", opts.userId);

  const { data, error } = await query;
  if (error) throw error;

  return ((data as SettleRow[] | null) || [])
    .filter((row) => {
      const created = new Date(row.created_at).getTime();
      if (!row.provider_id) return now - created > PENDING_ABANDONED_MS;
      if (row.ends_at) return new Date(row.ends_at).getTime() < now - STALE_GRACE_MS;
      return now - created > NO_EXPIRY_STALE_MS;
    })
    .slice(0, opts.limit);
}

export type SweepSummary = {
  checked: number;
  completed: number;
  refunded: number;
  retry: number;
  errors: number;
};

export async function settleStaleVerifications(
  admin: SupabaseClient,
  opts: { userId?: string; limit: number; parallel?: boolean },
): Promise<SweepSummary> {
  const rows = await findStaleVerifications(admin, opts);
  const summary: SweepSummary = { checked: rows.length, completed: 0, refunded: 0, retry: 0, errors: 0 };

  const settleOne = async (row: SettleRow) => {
    try {
      const result = await settleVerification(
        admin,
        row,
        "No code received before the number expired",
      );
      if (result.outcome === "completed") summary.completed += 1;
      else if (result.outcome === "refunded") summary.refunded += 1;
      else if (result.outcome === "retry") summary.retry += 1;
    } catch (err) {
      summary.errors += 1;
      console.error(`[textverify/settle] sweep failed for ${row.request_id}`, err);
    }
  };

  if (opts.parallel) {
    await Promise.all(rows.map(settleOne));
  } else {
    // One at a time keeps a large backlog from tripping the provider's rate limit.
    for (const row of rows) await settleOne(row);
  }
  return summary;
}
