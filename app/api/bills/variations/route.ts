import { NextResponse } from "next/server";
import { EbillsError, getDataVariations, getTvVariations } from "@/lib/ebills";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "data";
    const serviceId = searchParams.get("service_id") || undefined;

    if (type !== "data" && type !== "tv") {
      return NextResponse.json(
        { message: "type must be data or tv" },
        { status: 400 },
      );
    }

    const data =
      type === "data"
        ? await getDataVariations(serviceId)
        : await getTvVariations(serviceId);

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof EbillsError) {
      return NextResponse.json(
        { message: err.message, code: err.code, data: err.payload },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[bills/variations]", err);
    return NextResponse.json({ message: "Failed to load variations" }, { status: 500 });
  }
}
