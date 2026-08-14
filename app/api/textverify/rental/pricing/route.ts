import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import {
  TextVerifiedError,
  getRentalPricing,
  RentalDurationApi,
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
      isRenewable?: boolean;
      duration?: RentalDurationApi;
      alwaysOn?: boolean;
    };

    const serviceName = String(body.serviceName || "allservices").trim();
    const duration = body.duration || "sevenDay";
    const isRenewable = Boolean(body.isRenewable);

    const { usd, raw } = await getRentalPricing({
      serviceName,
      capability: body.capability || "sms",
      isRenewable,
      duration,
      alwaysOn: body.alwaysOn ?? true,
    });

    if (!usd || usd <= 0) {
      return NextResponse.json(
        { message: "No pricing available for this rental configuration" },
        { status: 404 },
      );
    }

    // Naira-only: USD cost and the raw provider payload are our buy price.
    void raw;
    return NextResponse.json({
      serviceName,
      is_renewable: isRenewable,
      duration,
      amount_ngn: usdToNgn(usd),
    });
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/rental/pricing]", err);
    return NextResponse.json({ message: "Failed to get rental pricing" }, { status: 500 });
  }
}
