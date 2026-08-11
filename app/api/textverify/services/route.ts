import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import {
  TextVerifiedError,
  listVerificationServices,
} from "@/lib/textverified";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const services = await listVerificationServices();
    const normalized = services
      .map((s) => ({
        serviceName: String(s.serviceName || s.service_name || ""),
        capability: String(s.capability || "sms"),
      }))
      .filter((s) => s.serviceName)
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));

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
    console.error("[textverify/services]", err);
    return NextResponse.json({ message: "Failed to load services" }, { status: 500 });
  }
}
