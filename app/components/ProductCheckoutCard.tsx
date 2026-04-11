"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface ProductCheckoutCardProps {
  productId: number;
  title: string;
  price: number;
  stock: number;
  description: string;
  previewLink?: string | null;
}

export default function ProductCheckoutCard({
  productId,
  title,
  price,
  stock,
  description,
  previewLink,
}: ProductCheckoutCardProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const subtotal = price * quantity;
  const grandTotal = subtotal;

  useEffect(() => {
    if (stock <= 0) {
      setQuantity(0);
      return;
    }
    setQuantity((q) => Math.min(Math.max(1, q), stock));
  }, [stock]);

  const handlePayment = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (stock <= 0) {
      setErrorMsg("This product is out of stock.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // 2. Fetch user profile to check balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("funds")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        setErrorMsg("Could not fetch your account balance. Please try again.");
        return;
      }

      // 3. Check if balance is sufficient (funds are in Naira)
      if (profile.funds < grandTotal) {
        setErrorMsg(
          `Insufficient balance. Your balance is ₦${Number(
            profile.funds,
          ).toFixed(2)} but the total is ₦${grandTotal.toFixed(
            2,
          )}. Please add funds to your account.`,
        );
        return;
      }

      // 4. Call the purchase_product RPC (atomic: deduct balance + create order + assign accounts)
      const { data: result, error: rpcError } = await supabase.rpc(
        "purchase_product",
        {
          p_product_id: productId,
          p_quantity: quantity,
          p_grand_total: grandTotal,
        },
      );

      if (rpcError) {
        setErrorMsg(rpcError.message || "Purchase failed. Please try again.");
        return;
      }

      if (!result?.success) {
        setErrorMsg(result?.error || "Purchase failed. Please try again.");
        return;
      }

      // 5. Success — redirect to orders page
      setSuccessMsg(
        `Order placed successfully! Order #${result.order_id}. Redirecting to your orders…`,
      );
      setTimeout(() => {
        router.push("/dashboard/my-orders");
      }, 1800);
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-gray-100 border rounded-lg p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Title */}
      <h2 className="text-lg sm:text-xl font-semibold wrap-break-word">{title}</h2>

      {/* Price Banner */}
      <div className="bg-[#F87D1F] text-white font-semibold rounded-md px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base">
        Price for 1 Piece: ₦{price.toFixed(2)}
      </div>

      {/* Stock & Quantity */}
      <div className="border rounded-lg p-4 sm:p-6 bg-white space-y-4">
        {stock <= 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This product is out of stock — inventory may update when new accounts
            are added.
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Stock:</span>
          <span>{stock}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-medium">Quantity:</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, stock)}
            value={stock <= 0 ? 0 : quantity}
            disabled={stock <= 0}
            onChange={(e) => {
              const val = Math.max(1, Math.min(stock, Number(e.target.value)));
              setQuantity(val);
            }}
            className="w-full rounded-md border px-3 py-2 sm:w-40 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <button className="text-[#194572] hover:underline flex items-center gap-2">
          🏷 Have a promo code?
        </button>
      </div>

      {/* Totals */}
      <div className="border rounded-lg p-4 sm:p-6 bg-white space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Sub Total:</span>
          <span>₦{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-bold">
          <span>Grand Total:</span>
          <span className="text-green-600">₦{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Preview Link */}
      {previewLink && (
        <div className="border rounded-lg p-4 bg-white">
          <span className="font-medium text-gray-800">Preview Link: </span>
          <a
            href={previewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#194572] underline break-all"
          >
            {previewLink}
          </a>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-start gap-2">
          <input type="checkbox" className="w-4 h-4" />
          <span className="leading-5">
            Subscribe to E-mail newsletter for products
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="w-4 h-4"
          />
          <span className="leading-5">
            I agree to the public offer and{" "}
            <a
              href="/policy"
              className="text-[#194572] underline cursor-pointer"
            >
              terms of use
            </a>
          </span>
        </label>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span className="mt-0.5 shrink-0">✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Payment Button */}
      <button
        disabled={!agree || loading || stock <= 0}
        onClick={handlePayment}
        className={`w-full py-3 rounded-md text-white font-semibold flex items-center justify-center gap-2 transition-colors ${
          agree && !loading && stock > 0
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Processing…
          </>
        ) : (
          "Proceed to Payment"
        )}
      </button>

      {/* Description */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="border-b p-4 font-semibold text-base sm:text-lg">
          Product Description
        </div>

        <div className="p-3 sm:p-4 text-gray-700 overflow-x-auto">
          <ReactQuill
            value={description || ""}
            readOnly={true}
            theme="snow"
            modules={{ toolbar: false }}
          />
        </div>
      </div>
    </div>
  );
}
