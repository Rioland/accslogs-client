import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import {
  TextVerifiedError,
  listVerificationServices,
  normalizeServices,
} from "@/lib/textverified";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const services = await listVerificationServices();
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
    console.error("[textverify/services]", err);
    return NextResponse.json({ message: "Failed to load services" }, { status: 500 });
  }
}
