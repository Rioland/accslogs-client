import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return {
      user: null,
      error: NextResponse.json({ message: "Server configuration error" }, { status: 500 }),
    };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnon);
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}
