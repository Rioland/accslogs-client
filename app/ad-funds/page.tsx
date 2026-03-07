"use client";

import React, { useState } from "react";
import { generatePaystackDedicatedAccount } from "@/lib/paystackServerActions";

const AdFundsPage = () => {
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAccountNumber = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generatePaystackDedicatedAccount();
      setAccountNumber(data.accountNumber);
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

      {accountNumber ? (
        <div>
          <h2 className="text-2xl font-bold">Your Account Number:</h2>
          <p className="text-lg">{accountNumber}</p>
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
