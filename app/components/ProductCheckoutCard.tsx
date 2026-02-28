"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RichTextRenderer from "./RichTextRenderer";

interface ProductCheckoutCardProps {
  productId: number;
  title: string;
  price: number;
  stock: number;
  description: string;
}

export default function ProductCheckoutCard({
  title,
  price,
  stock,
  description,
}: ProductCheckoutCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [agree, setAgree] = useState(true);

  const subtotal = price * quantity;
  const grandTotal = subtotal;

  return (
    <div className="max-w-7xl mx-auto bg-gray-100 border rounded-lg p-6 space-y-6">
      {/* Title */}
      <h2 className="text-xl font-semibold">{title}</h2>

      {/* Price Banner */}
      <div className="bg-orange-500 text-white font-semibold rounded-md px-6 py-4">
        Price for 1 Piece: {price.toFixed(2)}
      </div>

      {/* Stock & Quantity */}
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <div className="flex justify-between">
          <span className="font-medium">Stock:</span>
          <span>{stock}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-medium">Quantity:</span>
          <input
            type="number"
            min={1}
            max={stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-40 border rounded-md px-3 py-2"
          />
        </div>

        <button className="text-blue-600 hover:underline flex items-center gap-2">
          🏷 Have a promo code?
        </button>
      </div>

      {/* Totals */}
      <div className="border rounded-lg p-6 bg-white space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">Sub Total:</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Grand Total:</span>
          <span className="text-green-600">{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4" />
          <span>Subscribe to E-mail newsletter for products</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="w-4 h-4"
          />
          <span>
            I agree to the public offer and{" "}
            <span className="text-blue-600 underline cursor-pointer">
              terms of use
            </span>
          </span>
        </label>
      </div>

      {/* Payment Button */}
      <button
        disabled={!agree}
        className={`w-full py-3 rounded-md text-white font-semibold ${
          agree
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Proceed to Payment
      </button>

      {/* Description */}
      <div className="border rounded-lg bg-white">
        <div className="border-b p-4 font-semibold text-lg">
          Product Description
        </div>

        <div className="p-4 text-gray-700">
          <RichTextRenderer content={description} />
        </div>
      </div>
    </div>
  );
}
