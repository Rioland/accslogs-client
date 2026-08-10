"use client";

import React, { useState, useEffect } from "react";
import supabaseClient from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type DedicatedAccount = {
  accountNumber: string;
  accountBank: string;
  accountName: string;
};

/**
 * The Korapay secret key stays on the server, so account details come from
 * /api/korapay/virtual-account rather than a direct call to Korapay.
 */
async function requestAccount(
  method: "GET" | "POST",
  token: string,
): Promise<DedicatedAccount | null> {
  const res = await fetch("/api/korapay/virtual-account", {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(json?.message || "Failed to load account details");
  }
  return json.account ?? null;
}

const AdFundsPage = () => {
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [accountBank, setAccountBank] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchExisting = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      try {
        const account = await requestAccount("GET", session.access_token);
        if (account) {
          setAccountNumber(account.accountNumber);
          setAccountBank(account.accountBank);
          setAccountName(account.accountName);
        }
      } catch {
        // Nothing stored yet is the normal first-visit case; the generate
        // button surfaces any real failure.
      }
      setIsFetching(false);
    };
    fetchExisting();
  }, [router]);

  const generateAccountNumber = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const data = await requestAccount("POST", session.access_token);
      if (data) {
        setAccountNumber(data.accountNumber);
        setAccountBank(data.accountBank);
        setAccountName(data.accountName);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Ad Funds</h1>
      <p className="mb-8">
        Generate a dedicated virtual account number to fund your account.
      </p>

      {isFetching ? (
        <p className="text-gray-600">Loading account...</p>
      ) : accountNumber ? (
        <div>
          <h2 className="text-2xl font-bold">Your Account Number:</h2>
          <p className="text-lg">{accountNumber}</p>
          <p className="text-lg">{accountBank}</p>
          <p className="text-lg">{accountName}</p>
        </div>
      ) : (
        <button
          onClick={generateAccountNumber}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? "Generating..." : "Generate Account Number"}
        </button>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default AdFundsPage;
