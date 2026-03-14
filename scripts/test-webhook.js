#!/usr/bin/env node
/**
 * Test script for Korapay webhook - simulates a charge.success callback.
 * Run: node scripts/test-webhook.js
 * Or: KORAPAY_SECRET_KEY=sk_live_xxx USER_ID=your-uuid node scripts/test-webhook.js
 *
 * Requires: USER_ID (a real user UUID from your database) and KORAPAY_SECRET_KEY
 */

const crypto = require("crypto");

const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://topnotchlogs.com/api/webhook";
const SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
const USER_ID = process.env.USER_ID;

if (!SECRET_KEY) {
  console.error("Error: Set KORAPAY_SECRET_KEY in env or .env");
  process.exit(1);
}

if (!USER_ID) {
  console.error("Error: Set USER_ID (a valid UUID from your profiles table)");
  console.error("Example: USER_ID=550e8400-e29b-41d4-a716-446655440000 node scripts/test-webhook.js");
  process.exit(1);
}

const payload = {
  event: "charge.success",
  data: {
    reference: "KPY-C-cUBkIH&98n8b",
    currency: "NGN",
    amount: "22000",
    amount_expected: "22000",
    fee: "25",
    status: "success",
    payment_reference: `${USER_ID}-${Date.now()}`,
    transaction_status: "success",
    metadata: {
      userId: USER_ID,
      source: "checkout_standard",
    },
  },
};

const payloadString = JSON.stringify(payload);
const dataString = JSON.stringify(payload.data);
const signature = crypto
  .createHmac("sha256", SECRET_KEY)
  .update(dataString)
  .digest("hex");

console.log("POSTing to:", WEBHOOK_URL);
console.log("Payload:", payloadString);
console.log("Signature:", signature);
console.log("---");

const https = require("https");
const url = new URL(WEBHOOK_URL);
const opts = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-korapay-signature": signature,
    "Content-Length": Buffer.byteLength(payloadString),
  },
};

const req = https.request(opts, (res) => {
  let body = "";
  res.on("data", (ch) => (body += ch));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", body);
  });
});
req.on("error", (err) => console.error("Error:", err.message));
req.write(payloadString);
req.end();
