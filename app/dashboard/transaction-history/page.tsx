/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import {
  Menu,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  ChevronRight,
  Eye,
  Receipt,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar1 from "../../components/Navbar1";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";

interface Deposit {
  id: string;
  amount: number;
  reference: string;
  status: "pending" | "successful" | "failed";
  created_at: string;
  korapay_data?: any;
}

interface Epin {
  amount: string | null;
  pin: string | null;
  serial: string | null;
  instruction: string | null;
}

interface BillPayment {
  id: number;
  request_id: string;
  product_type: string;
  service_id: string;
  customer_id: string | null;
  variation_id: string | null;
  amount: number;
  status: string;
  order_id: string | null;
  token: string | null;
  units: string | null;
  epins: Epin[];
  awaiting_delivery?: boolean;
  error_message: string | null;
  created_at: string;
}

const PRODUCT_LABELS: Record<string, string> = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  tv: "Cable TV",
  betting: "Betting",
  epins: "Recharge PINs",
};

/** A value the user needs to copy — token, PIN or serial. */
function CopyableValue({
  label,
  value,
  mono = true,
  big = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  big?: boolean;
}) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-green-700">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p
          className={`min-w-0 break-all text-green-900 ${mono ? "font-mono" : ""} ${
            big ? "text-lg font-bold" : "text-sm font-semibold"
          }`}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
          aria-label={`Copy ${label}`}
          className="ml-auto shrink-0 rounded border border-green-300 bg-white p-1.5 text-green-700 hover:bg-green-100"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function TransactionHistoryPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [bills, setBills] = useState<BillPayment[]>([]);
  const [details, setDetails] = useState<BillPayment | null>(null);
  const [tab, setTab] = useState<"bills" | "deposits">("bills");
  const [isLoading, setIsLoading] = useState(true);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  /** Ask the provider again for a token/PIN that was not ready at purchase. */
  const refreshOrder = async (payment: BillPayment, silent = false) => {
    setRefreshing(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/bills/requery", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: payment.request_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not refresh");

      const updated: BillPayment = {
        ...payment,
        token: data.token ?? payment.token,
        units: data.units ?? payment.units,
        epins: data.epins?.length ? data.epins : payment.epins,
        awaiting_delivery: !data.token && !data.epins?.length,
      };

      setDetails((d) => (d && d.id === payment.id ? updated : d));
      setBills((list) => list.map((x) => (x.id === payment.id ? updated : x)));

      if (!silent) {
        if (data.token || data.epins?.length) toast.success("Details updated");
        else toast("Still processing — try again shortly");
      }
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Could not refresh");
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const [depositRes, billRes] = await Promise.allSettled([
        supabaseClient
          .from("deposits")
          .select("id, amount, reference, status, created_at, korapay_data")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        fetch("/api/bills/history", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then((r) => r.json()),
      ]);

      if (depositRes.status === "fulfilled" && !depositRes.value.error) {
        setDeposits(depositRes.value.data || []);
      } else {
        console.error("Error fetching deposits:", depositRes);
      }

      if (billRes.status === "fulfilled") {
        if (billRes.value?.message && !billRes.value?.payments) {
          // Surface the reason instead of showing an empty list, which reads as
          // "you have no purchases" when the real problem is a failed request.
          setBillsError(billRes.value.message);
        } else {
          setBills(billRes.value?.payments || []);
        }
      } else {
        console.error("Error fetching bill payments:", billRes);
        setBillsError("Could not load your purchases. Please refresh.");
      }

      setIsLoading(false);
    };

    fetchAll();
  }, [router]);

  // Opening an order that never received its token/PIN silently asks the
  // provider again, so the common case resolves without the user doing anything.
  useEffect(() => {
    if (details?.awaiting_delivery) void refreshOrder(details, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.id]);

  // Escape closes the details dialog, and the page behind it must not scroll
  // while it is open.
  useEffect(() => {
    if (!details) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetails(null);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [details]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "successful":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getSourceLabel = (deposit: Deposit) => {
    const payload = deposit.korapay_data as any;

    const hasVirtualAccount =
      payload?.virtual_bank_account_details?.virtual_bank_account;

    const sourceMeta = payload?.metadata?.source;

    if (hasVirtualAccount) {
      return "Virtual Account";
    }

    if (sourceMeta === "bank_transfer_dynamic") {
      return "Bank Transfer (Dynamic)";
    }

    if (sourceMeta === "checkout_standard") {
      return "Korapay Checkout";
    }

    if (payload) {
      return "Korapay";
    }

    return "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "text-green-800 bg-green-100";
      case "failed":
        return "text-red-800 bg-red-100";
      default:
        return "text-yellow-800 bg-yellow-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChange = async (key: string) => {
    if (key === "sign-out") {
      await supabaseClient.auth.signOut();
      router.push("/login");
    } else {
      router.push(
        `/dashboard${key !== "home" ? `/${key.replace("-", "-")}` : ""}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />

      {/* Top bar for mobile with menu toggle */}
      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-backdrop-filter:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">
            Transaction History
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop static */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="transaction-history" onChange={handleChange} />
        </div>

        {/* Sidebar: mobile off-canvas */}
        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">
                    Menu
                  </span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="transaction-history"
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

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Transaction History
          </h1>

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87D1F] mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  {(
                    [
                      ["bills", "Bills & Purchases", bills.length],
                      ["deposits", "Deposits", deposits.length],
                    ] as const
                  ).map(([key, label, count]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                        tab === key
                          ? "border-[#F87D1F] text-[#F87D1F]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}{" "}
                      <span className="text-xs text-gray-400">({count})</span>
                    </button>
                  ))}
                </div>

                {tab === "bills" && billsError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {billsError}
                  </div>
                )}

                {tab === "bills" &&
                  !billsError &&
                  (bills.length === 0 ? (
                    <div className="py-8 text-center">
                      <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No bill payments yet
                      </h3>
                      <p className="text-gray-600">
                        Airtime, data, electricity, TV, betting and recharge PIN
                        purchases will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bills.map((b) => {
                        const hasDeliverable =
                          !!b.token || b.epins.length > 0 || !!b.units;
                        return (
                          <div
                            key={b.id}
                            className="rounded-lg border border-gray-200"
                          >
                            <button
                              type="button"
                              onClick={() => setDetails(b)}
                              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-gray-50"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                {getStatusIcon(
                                  b.status === "completed"
                                    ? "successful"
                                    : b.status === "refunded" ||
                                        b.status === "failed"
                                      ? "failed"
                                      : "pending",
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900">
                                    ₦{b.amount.toLocaleString()}{" "}
                                    <span className="font-normal text-gray-500">
                                      ·{" "}
                                      {PRODUCT_LABELS[b.product_type] ||
                                        b.product_type}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 sm:text-sm">
                                    {b.service_id}
                                    {b.customer_id ? ` → ${b.customer_id}` : ""}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {formatDate(b.created_at)}
                                    </span>
                                    {hasDeliverable && (
                                      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                        {b.epins.length > 0
                                          ? `${b.epins.length} PIN${b.epins.length !== 1 ? "s" : ""}`
                                          : "Token available"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                    b.status === "completed"
                                      ? "successful"
                                      : b.status === "refunded" ||
                                          b.status === "failed"
                                        ? "failed"
                                        : "pending",
                                  )}`}
                                >
                                  {b.status}
                                </span>
                                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 sm:inline-flex">
                                  <Eye className="h-3.5 w-3.5" />
                                  View details
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400 sm:hidden" />
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {tab === "deposits" &&
                  (deposits.length === 0 ? (
                    <div className="py-8 text-center">
                      <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No deposits yet
                      </h3>
                      <p className="text-gray-600">
                        Your deposit transactions will appear here once you make
                        payments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Deposit History
                  </h2>
                  <span className="text-sm text-gray-600">
                    {deposits.length} transaction
                    {deposits.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {getStatusIcon(deposit.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">
                            ₦{deposit.amount.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {formatDate(deposit.created_at)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 break-all">
                              Ref: {deposit.reference}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100">
                              {getSourceLabel(deposit)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`self-start sm:self-auto px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}
                      >
                        {deposit.status.charAt(0).toUpperCase() +
                          deposit.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction details dialog */}
      {details && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setDetails(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Transaction details"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            {/* Header stays put while the body scrolls */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {PRODUCT_LABELS[details.product_type] || details.product_type}
                </h3>
                <p className="text-sm text-gray-500">
                  ₦{details.amount.toLocaleString()} · {details.service_id}
                  {details.customer_id ? ` → ${details.customer_id}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(details.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetails(null)}
                aria-label="Close"
                className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                  details.status === "completed"
                    ? "successful"
                    : details.status === "refunded" ||
                        details.status === "failed"
                      ? "failed"
                      : "pending",
                )}`}
              >
                {details.status}
              </span>

              {/* Nothing to copy yet — the provider was still processing. */}
              {!details.token &&
                details.epins.length === 0 &&
                details.awaiting_delivery && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">
                      {refreshing
                        ? "Checking with the provider..."
                        : "Your token/PIN is not ready yet"}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      The provider is still processing this order. Your payment
                      is safe — check again in a moment.
                    </p>
                    <button
                      type="button"
                      disabled={refreshing}
                      onClick={() => void refreshOrder(details)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                      />
                      {refreshing ? "Checking..." : "Check again"}
                    </button>
                  </div>
                )}

              {details.token && (
                <CopyableValue
                  label="Electricity token"
                  value={details.token}
                  big
                />
              )}
              {details.units && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Units: </span>
                  <span className="font-medium">{details.units}</span>
                </div>
              )}

              {details.epins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {details.epins.length} recharge PIN
                      {details.epins.length !== 1 ? "s" : ""}
                    </p>
                    {details.epins.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const all = details.epins
                            .map(
                              (p, i) =>
                                `${i + 1}. ${p.pin ?? ""}${p.serial ? ` (serial ${p.serial})` : ""}`,
                            )
                            .join("\n");
                          void navigator.clipboard.writeText(all);
                          toast.success("All PINs copied");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="h-3 w-3" />
                        Copy all
                      </button>
                    )}
                  </div>
                  {details.epins.map((p, i) => (
                    <div
                      key={`modal-pin-${i}`}
                      className="space-y-2 rounded-lg border border-gray-200 p-3"
                    >
                      <p className="text-xs font-medium text-gray-500">
                        PIN {i + 1}
                        {p.amount ? ` · ₦${p.amount}` : ""}
                      </p>
                      {p.pin && <CopyableValue label="PIN" value={p.pin} big />}
                      {p.serial && (
                        <p className="text-xs text-gray-500">
                          Serial:{" "}
                          <span className="font-mono">{p.serial}</span>
                        </p>
                      )}
                      {p.instruction && (
                        <p className="text-xs text-gray-600">
                          {p.instruction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <dl className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-gray-500">Reference</dt>
                  <dd className="break-all text-right font-mono text-xs text-gray-800">
                    {details.request_id}
                  </dd>
                </div>
                {details.order_id && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-gray-500">Order ID</dt>
                    <dd className="font-mono text-xs text-gray-800">
                      {details.order_id}
                    </dd>
                  </div>
                )}
                {details.variation_id && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-gray-500">Plan</dt>
                    <dd className="break-all text-right text-xs text-gray-800">
                      {details.variation_id}
                    </dd>
                  </div>
                )}
              </dl>

              {details.error_message && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {details.error_message}
                </p>
              )}

              {!details.token &&
                details.epins.length === 0 &&
                !details.units &&
                !details.error_message &&
                !details.awaiting_delivery && (
                  <p className="text-xs text-gray-500">
                    This purchase type has no token or PIN to copy.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
