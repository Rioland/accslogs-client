/**
 * Every 10 minutes, settle SMS verifications whose window closed while the
 * customer was away: refund the ones that never received a code, complete the
 * ones that did. The work happens in /api/textverify/reconcile; this only
 * triggers it.
 *
 * Needs TEXTVERIFY_CRON_SECRET set in the site's environment variables (any
 * long random string). Without it this function logs and does nothing.
 * Scheduled functions only run on the published production deploy.
 */
const reconcile = async (_req, context) => {
  const secret = process.env.TEXTVERIFY_CRON_SECRET;
  const base = process.env.URL || context?.site?.url;

  if (!secret || !base) {
    console.log("[textverify-reconcile] skipped: TEXTVERIFY_CRON_SECRET or site URL not set");
    return new Response("skipped", { status: 200 });
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/api/textverify/reconcile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`[textverify-reconcile] ${res.status} ${body}`);
  return new Response(body, { status: res.status });
};

export default reconcile;

export const config = {
  schedule: "*/10 * * * *",
};
