/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import { Menu, X, CreditCard, Copy, CheckCircle } from "lucide-react";
import Navbar1 from "../../components/Navbar1";
import dynamic from "next/dynamic";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";
import {
  generateKorapayDedicatedAccount,
  getKorapayDedicatedAccount,
} from "@/lib/KorapayServerActions";
import toast from "react-hot-toast";

const Navbar2 = dynamic(() => import("../../components/Navbar2"), {
  ssr: false,
});

export default function AddFundsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountBank, setAccountBank] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAccountDetails = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const account = await getKorapayDedicatedAccount(session.user.id);
      if (account) {
        setAccountNumber(account.accountNumber);
        setAccountBank(account.accountBank);
        setAccountName(account.accountName);
      }
      setIsFetching(false);
    };

    fetchAccountDetails();
  }, [router]);

  const handleGenerateAccount = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const data = await generateKorapayDedicatedAccount(session.user.id);

      setAccountNumber(data.accountNumber);
      setAccountBank(data.accountBank);
      setAccountName(data.accountName);
      toast.success("Account ready!");
    } catch (error) {
      console.error("Error generating account:", error);
      toast.error("An error occurred while generating account number");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
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

  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      {/* Top bar for mobile with menu toggle */}
      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
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
                          title="Copy account number"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
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
        </div>
      </div>
      <Footer />
    </div>
  );
}
