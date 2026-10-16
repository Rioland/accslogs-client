"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import TopBar from "../../components/TopBar";
import Navbar1 from "../../components/Navbar1";
import { notifyEmailVerified } from "@/lib/emailVerifiedEvents";

type Status =
  | { kind: "verifying" }
  | { kind: "verified" }
  | { kind: "error"; message: string };

function VerifyEmailContent() {
  const token = useSearchParams().get("token") || "";
  const [status, setStatus] = useState<Status>(
    token
      ? { kind: "verifying" }
      : { kind: "error", message: "This verification link is incomplete. Open the link from your email again." },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus({ kind: "error", message: json.message || "We couldn't verify your email." });
          return;
        }
        setStatus({ kind: "verified" });
        notifyEmailVerified();
      } catch {
        if (!cancelled) {
          setStatus({ kind: "error", message: "Network error. Check your connection and try again." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto my-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl sm:my-12 sm:p-8">
      {status.kind === "verifying" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#F87D1F]" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Verifying your email…</h1>
        </>
      )}

      {status.kind === "verified" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Email verified</h1>
          <p className="mt-2 text-sm text-gray-600">
            Thanks! Your Topnotchlogs account is now verified.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#F87D1F] px-4 py-3 font-medium text-white hover:bg-[#e06b10]"
          >
            Go to dashboard
          </Link>
        </>
      )}

      {status.kind === "error" && (
        <>
          <MailWarning className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Couldn’t verify email</h1>
          <p className="mt-2 text-sm text-gray-600">{status.message}</p>
          <p className="mt-2 text-sm text-gray-600">
            You can request a new link from the banner on your dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#194572] px-4 py-3 font-medium text-white hover:bg-[#143a60]"
          >
            Go to dashboard
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <TopBar />
      <Navbar1 />
      <div className="flex flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
        <Suspense
          fallback={
            <div className="mx-auto my-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F87D1F]" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
