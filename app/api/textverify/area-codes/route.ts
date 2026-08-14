import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/billsAuth";
import { TextVerifiedError, listAreaCodes } from "@/lib/textverified";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { user, error } = await getAuthedUser(req);
    if (error || !user) return error!;

    const areaCodes = await listAreaCodes();

    // Group by state so the UI can render a sensible picker.
    const byState = new Map<string, string[]>();
    for (const entry of areaCodes) {
      const state = String(entry.state || "Other");
      if (!byState.has(state)) byState.set(state, []);
      byState.get(state)!.push(String(entry.areaCode));
    }

    const states = [...byState.entries()]
      .map(([state, codes]) => ({ state, codes: codes.sort() }))
      .sort((a, b) => a.state.localeCompare(b.state));

    return NextResponse.json(
      { areaCodes, states },
      { headers: { "Cache-Control": "private, max-age=86400" } },
    );
  } catch (err) {
    if (err instanceof TextVerifiedError) {
      return NextResponse.json(
        { message: err.message, code: err.code },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[textverify/area-codes]", err);
    return NextResponse.json({ message: "Failed to load area codes" }, { status: 500 });
  }
}
