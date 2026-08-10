import { NextResponse } from "next/server";

import { getAuthedUser } from "@/lib/billsAuth";
import {
  getOrCreateVirtualAccount,
  getVirtualAccount,
} from "@/lib/korapayServer";

export const runtime = "nodejs";

/** Existing dedicated account for the signed-in user, if one has been created. */
export async function GET(req: Request) {
  const { user, error } = await getAuthedUser(req);
  if (error) return error;

  try {
    const account = await getVirtualAccount(user.id);
    return NextResponse.json({ status: "success", account });
  } catch (err) {
    console.error("korapay/virtual-account GET:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to load account details" },
      { status: 500 },
    );
  }
}

/** Creates the dedicated account for the signed-in user, or returns the existing one. */
export async function POST(req: Request) {
  const { user, error } = await getAuthedUser(req);
  if (error) return error;

  try {
    const account = await getOrCreateVirtualAccount(user.id);
    return NextResponse.json({ status: "success", account });
  } catch (err) {
    console.error("korapay/virtual-account POST:", err);
    return NextResponse.json(
      {
        status: "error",
        message:
          err instanceof Error && err.message === "Profile not found"
            ? "Profile not found"
            : "Failed to create virtual account",
      },
      { status: 500 },
    );
  }
}
