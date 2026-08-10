/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import { Menu, X, CreditCard } from "lucide-react";
import Navbar1 from "../../components/Navbar1";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";
import toast from "react-hot-toast";

const KORAPAY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY ||
  process.env.KORAPAY_PUBLIC_KEY ||
  "pk_live_tLyzjGeuw63zfKsQctoi8vKJdcT9MoVtvR84AM7W";

export default function AddFundsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const [isKorapayReady, setIsKorapayReady] = useState(false);
  const router = useRouter();

  // Load Korapay Checkout Standard script for direct payments
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).Korapay) {
      setIsKorapayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;
    script.onload = () => setIsKorapayReady(true);
    script.onerror = () => {
      console.error("Failed to load Korapay collections script");
    };

    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const handleKorapayPay = async () => {
    try {
      if (!KORAPAY_PUBLIC_KEY) {
        toast.error("Payment configuration missing. Please try again later.");
        return;
      }

      const amountNumber = Number(payAmount);
      if (!payAmount || Number.isNaN(amountNumber) || amountNumber <= 0) {
        toast.error("Please enter a valid amount.");
        return;
      }

      if (!isKorapayReady || typeof window === "undefined" || !(window as any).Korapay) {
        toast.error("Payment service is not ready yet. Please wait a moment and try again.");
        return;
      }

      setIsPaying(true);

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const user = session.user;
      // Must be unique per payment (≤50 chars). Format: user.id-timestamp
      const reference = `${user.id}-${Date.now()}`;

      const customerName =
        (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
        user.email ||
        "Customer";

      const amountToCharge = Math.floor(amountNumber);

      (window as any).Korapay.initialize({
        key: KORAPAY_PUBLIC_KEY,
        reference,
        amount: amountToCharge,
        currency: "NGN",
        customer: {
          name: customerName,
          email: user.email,
        },
        notification_url: `${window.location.origin}/api/webhook`,
        metadata: {
          userId: user.id,
          source: "checkout_standard",
        },
        onSuccess: async function (data?: { amount?: string | number; reference?: string; status?: string }) {
          // Fallback: webhook may not reach localhost - confirm deposit server-side
          try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
              await fetch("/api/confirm-deposit", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  reference,
                  amount: data?.amount ?? amountToCharge,
                  status: data?.status ?? "success",
                }),
              });
            }
          } catch (e) {
            console.warn("Confirm deposit fallback:", e);
          }
          toast.success(
            "Payment successful. Your balance and transactions will update shortly.",
          );
          setPayAmount("");
        },
        onFailed: function () {
          toast.error("Payment failed or was cancelled.");
        },
        onClose: function () {
          // Optional: you can show a message here if desired
        },
      });
    } catch (error) {
      console.error("Korapay checkout error:", error);
      toast.error("An error occurred while initializing payment.");
    } finally {
      setIsPaying(false);
    }
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
            Add Funds
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop static */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="add-funds" onChange={handleChange} />
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
                    activeKey="add-funds"
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
            Add Funds
          </h1>

          {/* Dedicated bank account generation - commented out, using only Korapay standard
          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-[#F87D1F] mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Fund Your Account
                </h2>
                <p className="text-sm text-gray-600">
                  Generate a virtual account number to deposit funds securely
                </p>
              </div>

              {isFetching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87D1F] mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading account...</p>
                </div>
              ) : !accountNumber ? (
                <div className="text-center">
                  <button
                    onClick={handleGenerateAccount}
                    disabled={isLoading}
                    className="w-full bg-[#F87D1F] hover:bg-[#e06b10] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Generating..." : "Generate Account Number"}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    This will create a unique account number for secure deposits
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Account Generated Successfully
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Use the details below to make deposits. Funds will be
                      credited automatically.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={accountNumber}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                        <button
                          onClick={() => copyToClipboard(accountNumber)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title={copied ? "Copied!" : "Copy account number"}
                        >
                          <Copy
                            className={`h-4 w-4 ${
                              copied ? "text-green-600" : "text-gray-600"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={accountBank}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>

                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Deposits are processed
                      automatically. Check your transaction history for deposit
                      confirmations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-[#194572] mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Pay Directly with Korapay
                </h2>
                <p className="text-sm text-gray-600">
                  Make an instant payment with card, bank transfer, or other channels.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NGN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="Enter amount you want to add"
                  />
                </div>

                <button
                  onClick={handleKorapayPay}
                  disabled={
                    isPaying ||
                    !payAmount ||
                    Number.isNaN(Number(payAmount)) ||
                    Number(payAmount) <= 0
                  }
                  className="w-full bg-[#194572] hover:bg-[#153657] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isPaying ? "Initializing payment..." : "Pay with Korapay"}
                </button>

                <p className="text-xs text-gray-500">
                  After a successful payment, your wallet balance and transaction history
                  will be updated automatically once we receive confirmation from Korapay.
                </p>
              </div>
            </div>
          </div>

          {/* Bank transfer (one-time account) - commented out, using only Korapay standard
          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-[#0f766e] mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Bank Transfer (One-Time Account)
                </h2>
                <p className="text-sm text-gray-600">
                  Generate a temporary bank account for a single transfer via Korapay.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NGN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="Enter amount you want to add"
                  />
                </div>

                <button
                  onClick={handleBankTransferGenerate}
                  disabled={
                    isBankLoading ||
                    !bankAmount ||
                    Number.isNaN(Number(bankAmount)) ||
                    Number(bankAmount) <= 0
                  }
                  className="w-full bg-[#0f766e] hover:bg-[#115e59] disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isBankLoading
                    ? "Generating bank account..."
                    : "Generate Bank Transfer Account"}
                </button>

                {bankAccountNumber && (
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankBankName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={bankAccountName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>
                    {bankReference && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Reference
                        </label>
                        <input
                          type="text"
                          value={bankReference}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                      </div>
                    )}
                    {bankExpiry && (
                      <p className="text-xs text-gray-500">
                        Expires at:{" "}
                        {new Date(bankExpiry).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Use these details to make a one-time transfer. Once Korapay confirms
                      the payment, your balance and transaction history will update
                      automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          */}
        </div>
      </div>
      <Footer />
    </div>
  );
}
