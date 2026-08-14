import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import {
  TextVerifiedError,
  listRentalServices,
  normalizeServices,
} from "@/lib/textverified";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const isRenewable =
      new URL(req.url).searchParams.get("isRenewable") === "true";
    const services = await listRentalServices(isRenewable);
    const normalized = normalizeServices(services);

    return NextResponse.json(
      { services: normalized },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/rental/services]", err);
    return NextResponse.json(
      { message: "Failed to load rental services" },
      { status: 500 },
    );
  }
}
