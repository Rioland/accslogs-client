import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { EbillsError, verifyCustomer } from "@/lib/ebills";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const body = await req.json();
    const customer_id = String(body.customer_id || "").trim();
    const service_id = String(body.service_id || "").trim();
    const variation_id = body.variation_id
      ? String(body.variation_id).trim()
      : undefined;

    if (!customer_id || !service_id) {
      return NextResponse.json(
        { message: "customer_id and service_id are required" },
        { status: 400 },
      );
    }

    const data = await verifyCustomer({
      customer_id,
      service_id,
      variation_id,
    });

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof EbillsError) {
      return NextResponse.json(
        { message: err.message, code: err.code, data: err.payload },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[bills/verify]", err);
    return NextResponse.json({ message: "Verification failed" }, { status: 500 });
  }
}
