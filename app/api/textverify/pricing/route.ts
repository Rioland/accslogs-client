import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import {
  TextVerifiedError,
  getVerificationPricing,
  usdToNgn,
} from "@/lib/textverified";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = (await req.json()) as {
      serviceName?: string;
      capability?: string;
      areaCode?: boolean;
    };
    const serviceName = String(body.serviceName || "").trim();
    if (!serviceName) {
      return NextResponse.json({ message: "serviceName is required" }, { status: 400 });
    }

    const { usd, raw } = await getVerificationPricing({
      serviceName,
      capability: body.capability || "sms",
      areaCode: Boolean(body.areaCode),
    });

    if (!usd || usd <= 0) {
      return NextResponse.json(
        { message: "No pricing available for this service right now" },
        { status: 404 },
      );
    }

    // Deliberately naira-only: the USD cost and the raw provider payload are
    // our buy price, and must not reach the browser.
    void raw;
    return NextResponse.json({
      serviceName,
      amount_ngn: usdToNgn(usd),
    });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/pricing]", err);
    return NextResponse.json({ message: "Failed to get pricing" }, { status: 500 });
  }
}
