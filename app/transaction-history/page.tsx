"use client";

import React, { useState, useEffect } from "react";
import supabaseClient from "@/lib/supabaseClient";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  reference: string;
}

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();

      if (sessionError || !session) {
        setError("Unauthorized");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("transactions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setError("Failed to fetch transactions.");
        } else {
          setTransactions(data || []);
        }
      } catch (error) {
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Transaction History</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Reference</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="py-2 px-4 border-b">{transaction.reference}</td>
                <td className="py-2 px-4 border-b">{transaction.amount}</td>
                <td className="py-2 px-4 border-b">{transaction.status}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionHistoryPage;
