"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Smartphone,
  Loader2,
  Copy,
  RefreshCw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../Sidebar";
import Navbar1 from "../../components/Navbar1";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";
import { notifyFundsChanged } from "@/lib/fundsEvents";

type Mode = "verify" | "nonrenewable" | "renewable";

type Capability = "sms" | "voice";

type AreaState = { state: string; codes: string[] };

const CAPABILITIES: { value: Capability; label: string; hint: string }[] = [
  { value: "sms", label: "SMS", hint: "Receive a text code" },
  { value: "voice", label: "Voice call", hint: "Receive the code by call" },
];

type Service = {
  serviceName: string;
  /** Properly-cased provider label, e.g. "WhatsApp". */
  label?: string;
  /** Which delivery methods this service actually supports. */
  capabilities?: string[];
};

/**
 * The provider gives no popularity signal, so searching "insta" ranks InstaGC
 * and InstaRem above Instagram on name length alone. This list pulls the
 * services people actually verify to the top of their match tier. Every entry
 * was checked against the live catalogue.
 */
const POPULAR_SERVICES = new Set([
  "whatsapp", "google", "telegram", "instagram", "facebook", "tiktok",
  "discord", "snapchat", "twitter", "x", "uber", "airbnb", "amazon",
  "netflix", "paypal", "tinder", "microsoft", "apple", "linkedin", "openai",
  "claude", "steam", "spotify", "binance", "coinbase", "cashapp", "venmo",
  "doordash", "ubereats", "lyft", "grubhub", "bumble", "hinge", "signal",
  "viber", "wechat", "line", "yahoo", "protonmail", "ebay", "walmart",
  "target", "nike", "adidas", "expedia", "revolut", "wise", "payoneer",
  "skrill",
]);

type ActiveVerification = {
  id: number;
  request_id: string;
  provider_id: string;
  service_name: string;
  phone_number: string;
  amount_ngn: number;
  status: string;
  sms_code?: string | null;
  ends_at?: string | null;
};

type ActiveRental = {
  id: number;
  request_id: string;
  provider_id: string;
  service_name: string;
  phone_number: string;
  amount_ngn: number;
  status: string;
  is_renewable: boolean;
  duration: string;
  ends_at?: string | null;
  latest_code?: string | null;
  latest_content?: string | null;
};

type HistoryRow = {
  id: number;
  request_id: string;
  service_name: string;
  phone_number: string | null;
  amount_ngn: number;
  status: string;
  sms_code?: string | null;
  is_renewable?: boolean;
  duration?: string;
  created_at: string;
};

const NONRENEWABLE_DURATIONS = [
  { value: "oneDay", label: "1 day" },
  { value: "threeDay", label: "3 days" },
  { value: "sevenDay", label: "7 days" },
  { value: "fourteenDay", label: "14 days" },
] as const;

const RENEWABLE_DURATIONS = [
  { value: "thirtyDay", label: "30 days" },
  { value: "ninetyDay", label: "90 days" },
  { value: "oneYear", label: "1 year" },
] as const;

async function authHeaders() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session?.access_token) throw new Error("Please log in again");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export default function TextVerifyPage() {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("verify");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    if (m === "verify" || m === "nonrenewable" || m === "renewable") {
      setMode(m);
    }
  }, []);

  const [services, setServices] = useState<Service[]>([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const comboRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [duration, setDuration] = useState<string>("sevenDay");
  const [priceNgn, setPriceNgn] = useState<number | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [pricing, setPricing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [active, setActive] = useState<ActiveVerification | null>(null);
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [polling, setPolling] = useState(false);
  const [capability, setCapability] = useState<Capability>("sms");
  const [areaStates, setAreaStates] = useState<AreaState[]>([]);
  const [areaState, setAreaState] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [recovering, setRecovering] = useState<string | null>(null);

  /**
   * Purchase dialog: shows the number, counts down, and auto-refunds if no code
   * arrives. `deadline` is an absolute timestamp rather than a decrementing
   * counter so a backgrounded tab (where timers are throttled) still expires at
   * the right moment instead of drifting.
   *
   * The deadline comes from the provider's own `ends_at` — the number is dead
   * at that instant regardless of what we display, so counting to anything else
   * would either strand the user on a number that already expired, or refund
   * one that was still good. The constant below is only a fallback for when the
   * provider returns no expiry.
   */
  const NUMBER_WINDOW_SECONDS = 300;
  const MIN_WINDOW_MS = 30_000;
  const MAX_WINDOW_MS = 60 * 60_000;
  /**
   * Run the full provider window. TextVerified refunds unused verifications on
   * their side, so there is nothing to protect by cancelling early — a lead
   * time would only shorten the window the customer paid for. If the cancel is
   * rejected because the line just timed out, the route still refunds locally.
   */
  const CANCEL_LEAD_MS = 0;
  const [numberDialogOpen, setNumberDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(NUMBER_WINDOW_SECONDS);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const autoRefundRan = useRef(false);

  /**
   * Rentals get a confirmation dialog, never a countdown. A rental runs for
   * days to a year and collects many messages, so there is no single "did the
   * code arrive" moment — auto-refunding on a timer would destroy a number the
   * customer deliberately paid to keep. Refunds here are explicit, and the
   * provider decides eligibility.
   */
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [rentalHistory, setRentalHistory] = useState<HistoryRow[]>([]);

  const handleChange = useCallback(
    (key: string) => {
      const map: Record<string, string> = {
        home: "/dashboard",
        "add-funds": "/dashboard/add-funds",
        "pay-bills": "/dashboard/pay-bills",
        "text-verify": "/dashboard/text-verify",
        "my-orders": "/dashboard/my-orders",
        tickets: "/dashboard/tickets",
        "transaction-history": "/dashboard/transaction-history",
        profile: "/dashboard/profile",
      };
      if (map[key]) router.push(map[key]);
    },
    [router],
  );

  const durationOptions =
    mode === "renewable" ? RENEWABLE_DURATIONS : NONRENEWABLE_DURATIONS;

  /**
   * The catalogue is ~4,500 entries, so results are ranked and capped rather
   * than rendered wholesale: exact match, then prefix, then substring. Without
   * the ranking, typing "whats" buries "whatsapp" under every name that merely
   * contains it.
   */
  const SUGGESTION_LIMIT = 50;
  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services.slice(0, SUGGESTION_LIMIT);

    // Tier by match quality, then prefer the shortest name within a tier. Length
    // is a good proxy for "the one they meant": searching "face" should offer
    // facebook before thenorthface, and "tele" telegram before cointelegraph.
    const scored: { s: Service; tier: number }[] = [];

    for (const s of services) {
      const name = s.serviceName.toLowerCase();
      const label = (s.label || "").toLowerCase();

      let tier = -1;
      if (name === q || label === q) tier = 0;
      else if (name.startsWith(q) || label.startsWith(q)) tier = 1;
      else if (name.includes(q) || label.includes(q)) tier = 2;

      if (tier >= 0) scored.push({ s, tier });
    }

    scored.sort(
      (a, b) =>
        a.tier - b.tier ||
        Number(POPULAR_SERVICES.has(b.s.serviceName)) -
          Number(POPULAR_SERVICES.has(a.s.serviceName)) ||
        a.s.serviceName.length - b.s.serviceName.length ||
        a.s.serviceName.localeCompare(b.s.serviceName),
    );

    return scored.slice(0, SUGGESTION_LIMIT).map((x) => x.s);
  }, [services, serviceQuery]);

  const selectedService = useMemo(
    () => services.find((s) => s.serviceName === selected),
    [services, selected],
  );

  const totalMatches = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services.length;
    return services.reduce(
      (n, s) =>
        s.serviceName.toLowerCase().includes(q) ||
        (s.label || "").toLowerCase().includes(q)
          ? n + 1
          : n,
      0,
    );
  }, [services, serviceQuery]);

  const pickService = useCallback((name: string) => {
    setSelected(name);
    setServiceQuery(name);
    setSuggestOpen(false);
    setHighlight(-1);
  }, []);

  // Close the suggestion list when focus moves elsewhere on the page.
  useEffect(() => {
    if (!suggestOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [suggestOpen]);

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        mode === "verify"
          ? "/api/textverify/services"
          : `/api/textverify/rental/services?isRenewable=${mode === "renewable"}`,
        { headers },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load services");
      const list: Service[] = data.services || [];
      if (mode !== "verify") {
        const hasAll = list.some(
          (s) => s.serviceName.toLowerCase() === "allservices",
        );
        setServices(
          hasAll
            ? list
            : [
                {
                  serviceName: "allservices",
                  label: "All services",
                  capabilities: ["sms"],
                },
                ...list,
              ],
        );
        // Keep the search box in sync with the auto-selection, otherwise the
        // input looks empty while a service is actually chosen.
        setSelected((prev) => {
          if (prev) return prev;
          setServiceQuery("allservices");
          return "allservices";
        });
      } else {
        setServices(list);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  }, [mode]);

  const loadHistory = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/textverify/history", { headers });
      const data = await res.json();
      if (res.ok) setHistory(data.verifications || []);
    } catch {
      // ignore
    }
  }, []);

  const loadRentalHistory = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/textverify/rental/history", { headers });
      const data = await res.json();
      if (res.ok) setRentalHistory(data.rentals || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setSelected("");
    setServiceQuery("");
    setSuggestOpen(false);
    setPriceNgn(null);
    if (mode === "verify") setDuration("sevenDay");
    else if (mode === "nonrenewable") setDuration("sevenDay");
    else setDuration("thirtyDay");
    void loadServices();
    void loadHistory();
    void loadRentalHistory();
  }, [mode, loadServices, loadHistory, loadRentalHistory]);

  // Pricing
  useEffect(() => {
    if (mode === "verify") {
      if (!selected) {
        setPriceNgn(null);
        return;
      }
      let cancelled = false;
      (async () => {
        setPricing(true);
        try {
          const headers = await authHeaders();
          const res = await fetch("/api/textverify/pricing", {
            method: "POST",
            headers,
            body: JSON.stringify({
              serviceName: selected,
              capability,
              areaCode: Boolean(areaCode),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Pricing failed");
          if (!cancelled) {
            setPriceNgn(data.amount_ngn);
          }
        } catch (err) {
          if (!cancelled) {
            setPriceNgn(null);
            toast.error(err instanceof Error ? err.message : "Pricing failed");
          }
        } finally {
          if (!cancelled) setPricing(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // rental pricing
    if (!selected || !duration) {
      setPriceNgn(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setPricing(true);
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/textverify/rental/pricing", {
          method: "POST",
          headers,
          body: JSON.stringify({
            serviceName: selected,
            capability: "sms",
            isRenewable: mode === "renewable",
            duration,
            alwaysOn: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Pricing failed");
        if (!cancelled) {
          setPriceNgn(data.amount_ngn);
        }
      } catch (err) {
        if (!cancelled) {
          setPriceNgn(null);
          toast.error(err instanceof Error ? err.message : "Pricing failed");
        }
      } finally {
        if (!cancelled) setPricing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, selected, duration, capability, areaCode]);

  // Area codes are static and cached server-side; load once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/textverify/area-codes", { headers });
        const data = await res.json();
        if (res.ok && !cancelled) setAreaStates(data.states || []);
      } catch {
        // optional feature — a failure here must not block buying
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll verification SMS
  useEffect(() => {
    if (!active || active.status !== "active") return;

    let stopped = false;
    setPolling(true);

    const tick = async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch(
          `/api/textverify/sms?request_id=${encodeURIComponent(active.request_id)}`,
          { headers },
        );
        const data = await res.json();
        if (!res.ok) return;
        const v = data.verification;
        if (!v) return;
        if (v.status === "completed") {
          setActive({ ...active, status: "completed", sms_code: data.code });
          toast.success(`Code received: ${data.code || "see message"}`);
          void loadHistory();
          return;
        }
        if (v.status === "expired") {
          setActive({ ...active, status: "expired" });
          toast.error("Number expired before a code arrived");
          void loadHistory();
        }
      } catch {
        // keep polling
      }
    };

    // The webhook is the primary delivery path; this poll is a safety net for
    // when webhooks are not configured or a delivery is dropped. It backs off
    // and pauses on hidden tabs so an idle number costs almost nothing.
    let timer: number | undefined;
    const startedAt = Date.now();

    const nextDelay = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 60_000) return 5_000;
      if (elapsed < 5 * 60_000) return 15_000;
      return 30_000;
    };

    const loop = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") await tick();
      if (!stopped) timer = window.setTimeout(loop, nextDelay());
    };

    void tick();
    timer = window.setTimeout(loop, nextDelay());

    const onVisible = () => {
      if (document.visibilityState === "visible" && !stopped) void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      setPolling(false);
    };
  }, [active?.request_id, active?.status, loadHistory]);

  // Poll rental SMS
  useEffect(() => {
    if (!activeRental || activeRental.status !== "active") return;

    let stopped = false;
    setPolling(true);

    const tick = async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch(
          `/api/textverify/rental/sms?request_id=${encodeURIComponent(activeRental.request_id)}`,
          { headers },
        );
        const data = await res.json();
        if (!res.ok) return;
        const rental = data.rental;
        if (rental?.status === "expired") {
          setActiveRental({ ...activeRental, status: "expired" });
          toast.error("Rental expired");
          void loadRentalHistory();
          return;
        }
        const messages = (data.messages || []) as Array<{
          parsedCode?: string;
          parsed_code?: string;
          smsContent?: string;
          sms_content?: string;
        }>;
        if (messages.length > 0) {
          const latest = messages[0];
          const code =
            latest.parsedCode ||
            latest.parsed_code ||
            null;
          const content = latest.smsContent || latest.sms_content || null;
          setActiveRental((prev) =>
            prev
              ? {
                  ...prev,
                  latest_code: code,
                  latest_content: content,
                }
              : prev,
          );
        }
      } catch {
        // keep polling
      }
    };

    void tick();
    const id = window.setInterval(() => {
      if (!stopped) void tick();
    }, 5000);

    return () => {
      stopped = true;
      window.clearInterval(id);
      setPolling(false);
    };
  }, [activeRental?.request_id, activeRental?.status, loadRentalHistory]);

  const runRecovery = async (action: "reuse" | "reactivate" | "report") => {
    if (!active) return;
    setRecovering(action);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/textverify/recover", {
        method: "POST",
        headers,
        body: JSON.stringify({ request_id: active.request_id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `${action} failed`);

      if (action === "report") {
        toast.success(data.message || "Reported");
      } else {
        setActive({
          id: data.id,
          request_id: data.request_id,
          provider_id: data.provider_id,
          service_name: data.service_name,
          phone_number: data.phone_number,
          amount_ngn: data.amount_ngn,
          status: "active",
          ends_at: data.ends_at,
        });
        toast.success(
          action === "reuse" ? "Number reused — watching for a new code" : "Number reactivated",
        );
        // reuse/reactivate mint a new charged verification.
        notifyFundsChanged(data.new_balance);
      }
      void loadHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setRecovering(null);
    }
  };

  const buyNumber = async () => {
    if (!selected) {
      toast.error("Choose a service first");
      return;
    }
    setBuying(true);
    try {
      const headers = await authHeaders();

      if (mode === "verify") {
        const res = await fetch("/api/textverify/create", {
          method: "POST",
          headers,
          body: JSON.stringify({
            serviceName: selected,
            capability,
            areaCodes: areaCode ? [areaCode] : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Purchase failed");

        setActiveRental(null);
        setActive({
          id: data.id,
          request_id: data.request_id,
          provider_id: data.provider_id,
          service_name: data.service_name,
          phone_number: data.phone_number,
          amount_ngn: data.amount_ngn,
          status: "active",
          ends_at: data.ends_at,
        });

        // Count down to the provider's own expiry. Clamped so a malformed or
        // stale ends_at can't produce an instant timeout or an endless timer.
        const providerEnd = data.ends_at
          ? new Date(data.ends_at).getTime() - CANCEL_LEAD_MS
          : NaN;
        const fallback = Date.now() + NUMBER_WINDOW_SECONDS * 1000;
        const endAt = Number.isFinite(providerEnd)
          ? Math.min(
              Math.max(providerEnd, Date.now() + MIN_WINDOW_MS),
              Date.now() + MAX_WINDOW_MS,
            )
          : fallback;

        autoRefundRan.current = false;
        setTimedOut(false);
        setConfirmCancel(false);
        setSecondsLeft(Math.ceil((endAt - Date.now()) / 1000));
        setDeadline(endAt);
        setNumberDialogOpen(true);
        notifyFundsChanged(data.new_balance);

        void loadHistory();
      } else {
        const res = await fetch("/api/textverify/rental/create", {
          method: "POST",
          headers,
          body: JSON.stringify({
            serviceName: selected,
            capability: "sms",
            isRenewable: mode === "renewable",
            duration,
            alwaysOn: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Rental failed");

        setActive(null);
        setActiveRental({
          id: data.id,
          request_id: data.request_id,
          provider_id: data.provider_id,
          service_name: data.service_name,
          phone_number: data.phone_number,
          amount_ngn: data.amount_ngn,
          status: "active",
          is_renewable: data.is_renewable,
          duration: data.duration,
          ends_at: data.ends_at,
        });
        setConfirmRefund(false);
        setRentalDialogOpen(true);
        notifyFundsChanged(data.new_balance);
        void loadRentalHistory();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBuying(false);
    }
  };

  const cancelActive = useCallback(
    async (reason: "user" | "timeout" = "user") => {
      if (!active) return;
      setCancelling(true);
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/textverify/cancel", {
          method: "POST",
          headers,
          body: JSON.stringify({ request_id: active.request_id, reason }),
        });
        const data = await res.json();

        // The code landed in the gap between the timer expiring and the cancel
        // request. Show the code instead of an error — it is theirs, they paid
        // for it, and it still works.
        if (res.status === 409 && data.completed) {
          setTimedOut(false);
          setNumberDialogOpen(true);
          setActive((prev) =>
            prev
              ? { ...prev, status: "completed", sms_code: data.code ?? null }
              : prev,
          );
          toast.success("Your code arrived just in time");
          void loadHistory();
          return;
        }

        if (!res.ok) throw new Error(data.message || "Cancel failed");

        const refunded =
          data.refunded != null
            ? `₦${Number(data.refunded).toLocaleString()} refunded`
            : "Refunded";

        // Money came back — tell the sidebar before anything else.
        notifyFundsChanged(null);

        if (reason === "timeout") {
          // A refund is a money event, so surface it in the dialog — reopening
          // it if the user hid it — rather than a toast they may never see.
          setTimedOut(true);
          setNumberDialogOpen(true);
          setActive((prev) => (prev ? { ...prev, status: "refunded" } : prev));
        } else {
          toast.success(`Cancelled. ${refunded}`);
          setNumberDialogOpen(false);
          setActive(null);
        }
        void loadHistory();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Cancel failed");
      } finally {
        setCancelling(false);
        setConfirmCancel(false);
      }
    },
    [active, loadHistory],
  );

  // Tick the countdown and fire the automatic refund exactly once. Driven by
  // the deadline rather than dialog visibility, so hiding the dialog cannot
  // strand a purchase that should have been refunded.
  useEffect(() => {
    if (deadline == null) return;
    if (active?.status === "completed" || timedOut) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !autoRefundRan.current) {
        autoRefundRan.current = true;
        void cancelActive("timeout");
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, active?.status, timedOut, cancelActive]);

  const refundActiveRental = async () => {
    if (!activeRental) return;
    setRefunding(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/textverify/rental/refund", {
        method: "POST",
        headers,
        body: JSON.stringify({ request_id: activeRental.request_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Refund failed");
      toast.success(
        data.refunded != null
          ? `Refunded ₦${Number(data.refunded).toLocaleString()}`
          : "Refunded",
      );
      notifyFundsChanged(null);
      setRentalDialogOpen(false);
      setActiveRental(null);
      void loadRentalHistory();
    } catch (err) {
      // The provider decides eligibility — a rental past its refund window
      // simply cannot be refunded, and the user needs to know why.
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefunding(false);
      setConfirmRefund(false);
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const modeTabs: Array<{ key: Mode; label: string }> = [
    { key: "verify", label: "Verifications" },
    { key: "nonrenewable", label: "Non-renewable" },
    { key: "renewable", label: "Renewable" },
  ];

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />

      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="font-semibold text-gray-900">SMS Verify</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-4 py-4 md:px-6 md:py-6">
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="text-verify" onChange={handleChange} />
        </div>

        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="h-full overflow-y-auto rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="font-semibold">Menu</span>
                  <button type="button" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="text-verify"
                    onChange={(key) => {
                      handleChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
              SMS Verify
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Buy one-time verifications or rent a US mobile number for days or
              months — paid from your wallet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {modeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMode(tab.key);
                  router.replace(`/dashboard/text-verify?mode=${tab.key}`, {
                    scroll: false,
                  });
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === tab.key
                    ? "bg-teal-800 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-teal-800">
                <Smartphone className="h-5 w-5 text-[#F87D1F]" />
                <h2 className="font-semibold">
                  {mode === "verify"
                    ? "Get a verification number"
                    : mode === "nonrenewable"
                      ? "Rent a number (1–14 days)"
                      : "Rent a renewable number"}
                </h2>
              </div>

              <label className="text-xs font-medium text-gray-500">
                Search service
              </label>
              <div ref={comboRef} className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={serviceQuery}
                  disabled={loadingServices}
                  onChange={(e) => {
                    setServiceQuery(e.target.value);
                    setSuggestOpen(true);
                    setHighlight(-1);
                    if (selected && e.target.value !== selected) setSelected("");
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (!suggestOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
                      setSuggestOpen(true);
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight((h) => Math.min(h + 1, filteredServices.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === "Enter") {
                      const pick =
                        filteredServices[highlight] ?? filteredServices[0];
                      if (pick) {
                        e.preventDefault();
                        pickService(pick.serviceName);
                      }
                    } else if (e.key === "Escape") {
                      setSuggestOpen(false);
                    }
                  }}
                  placeholder={
                    loadingServices
                      ? "Loading services..."
                      : mode === "verify"
                        ? "Type to search: google, whatsapp, discord..."
                        : "Type to search: allservices, google..."
                  }
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm disabled:bg-gray-50"
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-controls="service-suggestions"
                  aria-autocomplete="list"
                />

                {suggestOpen && !loadingServices && (
                  <div
                    id="service-suggestions"
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                  >
                    {filteredServices.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-500">
                        No service matches “{serviceQuery}”
                      </p>
                    ) : (
                      <>
                        {filteredServices.map((s, i) => (
                          <button
                            key={s.serviceName}
                            type="button"
                            onMouseEnter={() => setHighlight(i)}
                            onClick={() => pickService(s.serviceName)}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                              i === highlight
                                ? "bg-[#fff4ea] text-[#F87D1F]"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="min-w-0 truncate">
                              {s.label && s.label !== s.serviceName ? (
                                <>
                                  {s.label}
                                  <span className="ml-1.5 text-xs text-gray-400">
                                    {s.serviceName}
                                  </span>
                                </>
                              ) : (
                                s.serviceName
                              )}
                            </span>
                            {selected === s.serviceName && (
                              <span className="ml-2 shrink-0 text-xs">selected</span>
                            )}
                          </button>
                        ))}
                        {totalMatches > filteredServices.length && (
                          <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
                            Showing {filteredServices.length} of{" "}
                            {totalMatches.toLocaleString()} matches — keep typing
                            to narrow.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {selected && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected:{" "}
                  <span className="font-medium text-gray-900">{selected}</span>
                </p>
              )}

              {mode === "verify" && (
                <>
                  <label className="mt-4 block text-xs font-medium text-gray-500">
                    Delivery method
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {CAPABILITIES.map((c) => {
                      // Only offer what this service actually supports; the
                      // catalogue tells us per service.
                      const caps = selectedService?.capabilities;
                      const unsupported = !!caps && !caps.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          type="button"
                          disabled={unsupported}
                          onClick={() => setCapability(c.value)}
                          title={unsupported ? `${selected} has no ${c.label.toLowerCase()} option` : c.hint}
                          className={`rounded-lg border px-2 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            capability === c.value
                              ? "border-[#F87D1F] bg-[#fff4ea] text-[#F87D1F]"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Voice costs more than SMS.
                  </p>

                  {areaStates.length > 0 && (
                    <>
                      <label className="mt-4 block text-xs font-medium text-gray-500">
                        Preferred area code{" "}
                        <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <select
                          value={areaState}
                          onChange={(e) => {
                            setAreaState(e.target.value);
                            setAreaCode("");
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                        >
                          <option value="">Any state</option>
                          {areaStates.map((s) => (
                            <option key={s.state} value={s.state}>
                              {s.state}
                            </option>
                          ))}
                        </select>
                        <select
                          value={areaCode}
                          onChange={(e) => setAreaCode(e.target.value)}
                          disabled={!areaState}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">Any code</option>
                          {areaStates
                            .find((s) => s.state === areaState)
                            ?.codes.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                      {areaCode && (
                        <p className="mt-1.5 text-[11px] text-gray-400">
                          Choosing an area code may change the price and reduce
                          availability.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}

              {mode !== "verify" && (
                <>
                  <label className="mt-4 block text-xs font-medium text-gray-500">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    {durationOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Always-on SMS lines. Use{" "}
                    <span className="font-medium">allservices</span> to verify
                    many platforms on one number.
                  </p>
                </>
              )}

              <div className="mt-4 rounded-lg bg-[#f3f1ef] px-4 py-3 text-sm">
                {pricing ? (
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking price...
                  </span>
                ) : priceNgn != null ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="text-lg font-semibold text-teal-800">
                      ₦{priceNgn.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">
                    Select options to see price
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!selected || buying || pricing || priceNgn == null}
                onClick={() => void buyNumber()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F87D1F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {buying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "verify" ? "Buying number..." : "Starting rental..."}
                  </>
                ) : mode === "verify" ? (
                  "Buy number"
                ) : (
                  "Start rental"
                )}
              </button>

              <button
                type="button"
                onClick={() => void loadServices()}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh services
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-teal-800">Active number</h2>

              {mode === "verify" ? (
                !active ? (
                  <p className="text-sm text-gray-500">
                    After you buy a number it will appear here with live OTP
                    polling.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Service</p>
                      <p className="font-medium text-gray-900">
                        {active.service_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone number</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="font-mono text-lg font-semibold text-gray-900">
                          {active.phone_number}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            void copy(active.phone_number, "Number")
                          }
                          className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="capitalize text-gray-900">
                        {active.status}
                        {polling && active.status === "active" && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#F87D1F]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Waiting for SMS...
                          </span>
                        )}
                      </p>
                    </div>
                    {active.sms_code && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-xs font-medium text-green-700">
                          Verification code
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="font-mono text-2xl font-bold text-green-900">
                            {active.sms_code}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              void copy(String(active.sms_code), "Code")
                            }
                            className="rounded border border-green-300 bg-white p-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {active.status === "active" && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => void cancelActive()}
                          className="w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Cancel &amp; refund
                        </button>
                        <button
                          type="button"
                          disabled={recovering !== null}
                          onClick={() => void runRecovery("report")}
                          className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {recovering === "report" ? "Reporting..." : "Report a problem"}
                        </button>
                      </div>
                    )}

                    {/* Once a code has landed the number can often be reused for
                        the same service, or reactivated if reuse has lapsed. */}
                    {active.status === "completed" && (
                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500">
                          Need another code for {active.service_name}?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={recovering !== null}
                            onClick={() => void runRecovery("reuse")}
                            className="flex-1 rounded-full bg-[#F87D1F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e06d15] disabled:opacity-50"
                          >
                            {recovering === "reuse" ? "Reusing..." : "Reuse number"}
                          </button>
                          <button
                            type="button"
                            disabled={recovering !== null}
                            onClick={() => void runRecovery("reactivate")}
                            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {recovering === "reactivate" ? "..." : "Reactivate"}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Reuse works only shortly after a code arrives. Both
                          charge your wallet again.
                        </p>
                      </div>
                    )}
                  </div>
                )
              ) : !activeRental ? (
                <p className="text-sm text-gray-500">
                  After you start a rental it will appear here. Incoming SMS is
                  polled while the rental is active.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">
                      {activeRental.service_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone number</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="font-mono text-lg font-semibold text-gray-900">
                        {activeRental.phone_number}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void copy(activeRental.phone_number, "Number")
                        }
                        className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-gray-900">{activeRental.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ends</p>
                      <p className="text-gray-900">
                        {activeRental.ends_at
                          ? new Date(activeRental.ends_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="capitalize text-gray-900">
                      {activeRental.status}
                      {polling && activeRental.status === "active" && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#F87D1F]">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Listening for SMS...
                        </span>
                      )}
                    </p>
                  </div>
                  {(activeRental.latest_code || activeRental.latest_content) && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      {activeRental.latest_code && (
                        <>
                          <p className="text-xs font-medium text-green-700">
                            Latest code
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="font-mono text-2xl font-bold text-green-900">
                              {activeRental.latest_code}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                void copy(
                                  String(activeRental.latest_code),
                                  "Code",
                                )
                              }
                              className="rounded border border-green-300 bg-white p-1.5"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                      {activeRental.latest_content && (
                        <p className="mt-2 text-xs text-green-800">
                          {activeRental.latest_content}
                        </p>
                      )}
                    </div>
                  )}
                  {activeRental.status === "active" && (
                    <button
                      type="button"
                      onClick={() => void refundActiveRental()}
                      className="w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      End early &amp; refund
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-900">
                {mode === "verify" ? "Recent verifications" : "Recent rentals"}
              </h2>
            </div>
            {(mode === "verify" ? history : rentalHistory).length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500">No history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Number</th>
                      {mode !== "verify" && (
                        <th className="px-4 py-3">Duration</th>
                      )}
                      <th className="px-4 py-3">Amount</th>
                      {mode === "verify" && <th className="px-4 py-3">Code</th>}
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(mode === "verify" ? history : rentalHistory).map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.service_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.phone_number || "—"}
                        </td>
                        {mode !== "verify" && (
                          <td className="px-4 py-3">{row.duration || "—"}</td>
                        )}
                        <td className="px-4 py-3">
                          ₦{Number(row.amount_ngn).toLocaleString()}
                        </td>
                        {mode === "verify" && (
                          <td className="px-4 py-3 font-mono">
                            {row.sms_code || "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 capitalize">{row.status}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase dialog: number + countdown + cancel */}
      {numberDialogOpen && active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Your verification number"
            className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="border-b border-gray-200 p-5 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {active.status === "completed"
                  ? "Code received"
                  : timedOut
                    ? "No code arrived"
                    : "Your number is ready"}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                {active.service_name}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {/* The number */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Phone number
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <p className="font-mono text-2xl font-bold text-gray-900">
                    {active.phone_number}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copy(active.phone_number, "Number")}
                    aria-label="Copy number"
                    className="rounded border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Code, countdown, or timeout notice */}
              {active.status === "completed" && active.sms_code ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-green-700">
                    Verification code
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <p className="font-mono text-3xl font-bold text-green-900">
                      {active.sms_code}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void copy(String(active.sms_code), "Code")
                      }
                      aria-label="Copy code"
                      className="rounded border border-green-300 bg-white p-1.5 text-green-700 hover:bg-green-100"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : timedOut ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    No code arrived in time — you have been refunded.
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    ₦{Number(active.amount_ngn).toLocaleString()} is back in your
                    wallet. This is usually a network delay on the sender&apos;s
                    side. Please try again, or pick a different service.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Waiting for the code
                  </p>
                  <p
                    className={`mt-1 font-mono text-3xl font-bold tabular-nums ${
                      secondsLeft <= 60 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the number on {active.service_name}. If no code arrives
                    before the timer ends, you are refunded automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-5">
              {active.status === "completed" || timedOut ? (
                <button
                  type="button"
                  onClick={() => {
                    setNumberDialogOpen(false);
                    if (timedOut) setActive(null);
                  }}
                  className="w-full rounded-full bg-[#F87D1F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e06d15]"
                >
                  {timedOut ? "Try again" : "Done"}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => setConfirmCancel(true)}
                    className="w-full rounded-full border border-red-200 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Cancel & refund"}
                  </button>
                  {/* The timer keeps running and still auto-refunds when hidden. */}
                  <button
                    type="button"
                    onClick={() => setNumberDialogOpen(false)}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
                  >
                    Hide this and keep waiting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rental purchase dialog — details and an explicit refund, no timer */}
      {rentalDialogOpen && activeRental && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Your rented number"
            className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="border-b border-gray-200 p-5 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Your number is ready
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                {activeRental.service_name} ·{" "}
                {activeRental.is_renewable ? "Renewable" : "Non-renewable"}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Phone number
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <p className="font-mono text-2xl font-bold text-gray-900">
                    {activeRental.phone_number}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void copy(activeRental.phone_number, "Number")
                    }
                    aria-label="Copy number"
                    className="rounded border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500">Paid</dt>
                  <dd className="font-medium text-gray-900">
                    ₦{Number(activeRental.amount_ngn).toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="text-gray-900">{activeRental.duration}</dd>
                </div>
                {activeRental.ends_at && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500">
                      {activeRental.is_renewable ? "Renews" : "Expires"}
                    </dt>
                    <dd className="text-right text-gray-900">
                      {new Date(activeRental.ends_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  This number stays yours for the whole period and can receive
                  many messages. Incoming SMS appears on this page and in your
                  transaction history — you do not need to keep this open.
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => setRentalDialogOpen(false)}
                className="w-full rounded-full bg-[#F87D1F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e06d15]"
              >
                Done
              </button>
              <button
                type="button"
                disabled={refunding}
                onClick={() => setConfirmRefund(true)}
                className="w-full text-center text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
              >
                {refunding ? "Requesting refund..." : "I don't want this — request a refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental refund confirmation */}
      {confirmRefund && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm refund"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h4 className="text-base font-semibold text-gray-900">
              Refund this rental?
            </h4>
            <p className="mt-2 text-sm text-gray-600">
              The number is released and ₦
              {Number(activeRental?.amount_ngn ?? 0).toLocaleString()} is
              returned. Refunds are only possible within the provider&apos;s
              refund window — if it has passed, the request will be declined.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRefund(false)}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={refunding}
                onClick={() => void refundActiveRental()}
                className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {refunding ? "Refunding..." : "Yes, refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm cancellation"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h4 className="text-base font-semibold text-gray-900">
              Cancel this number?
            </h4>
            <p className="mt-2 text-sm text-gray-600">
              The number is released immediately and ₦
              {Number(active?.amount_ngn ?? 0).toLocaleString()} goes back to
              your wallet. If a code arrives after cancelling, it is lost.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep waiting
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => void cancelActive("user")}
                className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
