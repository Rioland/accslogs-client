/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import { Menu, X, Clock, CheckCircle, XCircle } from "lucide-react";
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

export default function TransactionHistoryPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDeposits = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabaseClient
        .from("deposits")
        .select("id, amount, reference, status, created_at, korapay_data")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deposits:", error);
      } else {
        setDeposits(data || []);
      }
      setIsLoading(false);
    };

    fetchDeposits();
  }, [router]);

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
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Transaction History
          </h1>

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87D1F] mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-600">
                  Your deposit transactions will appear here once you make
                  payments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <div className="font-medium text-gray-900">
                            ₦{deposit.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(deposit.created_at)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Ref: {deposit.reference}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100">
                              {getSourceLabel(deposit)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}
                      >
                        {deposit.status.charAt(0).toUpperCase() +
                          deposit.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
