"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MailWarning, X } from "lucide-react";
import toast from "react-hot-toast";
import supabaseClient from "@/lib/supabaseClient";
import { onEmailVerified } from "@/lib/emailVerifiedEvents";

const COOLDOWN_SECONDS = 60;
const DISMISS_KEY = "verify-email-banner-dismissed";

/**
 * Shown on every dashboard page until the user's email is verified. The
 * banner can be hidden for the current browser session, but returns on the
 * next visit until the user clicks the link in their email.
 */
export default function VerifyEmailBanner() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  const check = useCallback(async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("email, email_verified_at")
      .eq("id", session.user.id)
      .maybeSingle();

    // On a query error (e.g. migration not run yet) stay hidden rather than nag.
    if (error || !data) {
      setVisible(false);
      return;
    }
    if (data.email_verified_at) {
      setVisible(false);
      return;
    }

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === session.user.id;
    } catch {
      // Storage blocked: just show the banner.
    }
    setEmail(data.email || session.user.email || "");
    setVisible(!dismissed);
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void check(), 0);
    // Re-check when the user comes back from their email app or another tab.
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    const stopListening = onEmailVerified(() => setVisible(false));
    return () => {
      clearTimeout(initial);
      window.removeEventListener("focus", onFocus);
      stopListening();
    };
  }, [check]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) return;

    setSending(true);
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));

      if (json.alreadyVerified) {
        toast.success("Your email is already verified.");
        setVisible(false);
        return;
      }
      if (!res.ok) {
        const wait = /wait (\d+)s/.exec(json.message || "");
        if (wait) setCooldown(Number(wait[1]));
        throw new Error(json.message || "Could not send the link.");
      }

      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      toast.success(`Verification link sent to ${json.email || email}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send the link.");
    } finally {
      setSending(false);
    }
  };

  const dismiss = async () => {
    setVisible(false);
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    try {
      if (session) sessionStorage.setItem(DISMISS_KEY, session.user.id);
    } catch {
      // Ignore: the banner simply comes back on reload.
    }
  };

  if (!visible) return null;

  return (
    <div role="status" className="w-full border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-[1200px] items-start gap-3 px-4 py-3 md:px-6">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Verify your email address.</span>{" "}
            {sent ? (
              <>
                We’ve sent a link to <span className="font-medium break-all">{email}</span>.
                Check your inbox and spam folder.
              </>
            ) : (
              <>
                Confirm <span className="font-medium break-all">{email}</span> to secure
                your account. Didn’t get our email? Send a new link.
              </>
            )}
          </p>

          <button
            type="button"
            onClick={resend}
            disabled={sending || cooldown > 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#F87D1F] px-4 py-2 text-sm font-medium text-white hover:bg-[#e06b10] disabled:cursor-not-allowed disabled:bg-amber-300 sm:self-auto"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : sent
                ? "Resend link"
                : "Send verification link"}
          </button>
        </div>

        <button
          type="button"
          aria-label="Hide for now"
          onClick={dismiss}
          className="-mr-1 shrink-0 rounded-md p-1 text-amber-700 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
