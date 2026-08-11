"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Mode = "verify" | "nonrenewable" | "renewable";

type Service = { serviceName: string; capability: string };

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
  const [selected, setSelected] = useState<string>("");
  const [duration, setDuration] = useState<string>("sevenDay");
  const [priceNgn, setPriceNgn] = useState<number | null>(null);
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [pricing, setPricing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [active, setActive] = useState<ActiveVerification | null>(null);
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [polling, setPolling] = useState(false);
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
        referral: "/dashboard/referral",
        "transaction-history": "/dashboard/transaction-history",
        profile: "/dashboard/profile",
      };
      if (map[key]) router.push(map[key]);
    },
    [router],
  );

  const durationOptions =
    mode === "renewable" ? RENEWABLE_DURATIONS : NONRENEWABLE_DURATIONS;

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.serviceName.toLowerCase().includes(q));
  }, [services, serviceQuery]);

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
            : [{ serviceName: "allservices", capability: "sms" }, ...list],
        );
        setSelected((prev) => prev || "allservices");
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
    setPriceNgn(null);
    setPriceUsd(null);
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
        setPriceUsd(null);
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
            body: JSON.stringify({ serviceName: selected, capability: "sms" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Pricing failed");
          if (!cancelled) {
            setPriceNgn(data.amount_ngn);
            setPriceUsd(data.amount_usd);
          }
        } catch (err) {
          if (!cancelled) {
            setPriceNgn(null);
            setPriceUsd(null);
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
      setPriceUsd(null);
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
          setPriceUsd(data.amount_usd);
        }
      } catch (err) {
        if (!cancelled) {
          setPriceNgn(null);
          setPriceUsd(null);
          toast.error(err instanceof Error ? err.message : "Pricing failed");
        }
      } finally {
        if (!cancelled) setPricing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, selected, duration]);

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

    void tick();
    const id = window.setInterval(() => {
      if (!stopped) void tick();
    }, 4000);

    return () => {
      stopped = true;
      window.clearInterval(id);
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
          body: JSON.stringify({ serviceName: selected, capability: "sms" }),
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
        toast.success("Number ready — enter it on the target site");
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
        toast.success("Rental active — number is ready");
        void loadRentalHistory();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBuying(false);
    }
  };

  const cancelActive = async () => {
    if (!active) return;
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/textverify/cancel", {
        method: "POST",
        headers,
        body: JSON.stringify({ request_id: active.request_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cancel failed");
      toast.success(
        data.refunded != null
          ? `Cancelled. ₦${Number(data.refunded).toLocaleString()} refunded`
          : "Cancelled",
      );
      setActive(null);
      void loadHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  const refundActiveRental = async () => {
    if (!activeRental) return;
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
      setActiveRental(null);
      void loadRentalHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
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
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  placeholder={
                    mode === "verify"
                      ? "e.g. google, whatsapp, discord"
                      : "e.g. allservices, google"
                  }
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm"
                />
              </div>

              <label className="mt-4 block text-xs font-medium text-gray-500">
                Service
              </label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={loadingServices}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="">
                  {loadingServices ? "Loading services..." : "Select a service"}
                </option>
                {filteredServices.map((s) => (
                  <option key={s.serviceName} value={s.serviceName}>
                    {s.serviceName}
                  </option>
                ))}
              </select>

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
                      {priceUsd != null && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (~${priceUsd.toFixed(2)})
                        </span>
                      )}
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
                      <button
                        type="button"
                        onClick={() => void cancelActive()}
                        className="w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Cancel &amp; refund
                      </button>
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

      <Footer />
    </div>
  );
}
