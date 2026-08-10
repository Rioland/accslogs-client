"use client";

import Link from "next/link";
import { Smartphone, Wifi, Zap, Tv, ArrowRight } from "lucide-react";

const quickActions = [
  { key: "airtime", label: "Airtime", icon: Smartphone },
  { key: "data", label: "Data", icon: Wifi },
  { key: "electricity", label: "Electricity", icon: Zap },
  { key: "tv", label: "Cable TV", icon: Tv },
];

export default function BillPaymentsPromo() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#194572]/20 bg-linear-to-r from-[#194572] to-[#1f5a92] shadow-[0_6px_24px_rgba(0,0,0,0.10)]">
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#F87D1F] px-2.5 py-0.5 text-xs font-semibold text-white">
              NEW
            </span>
            <h2 className="mt-2 text-lg md:text-xl font-semibold text-white">
              Pay Bills right from your wallet
            </h2>
            <p className="mt-1 text-sm text-white/80 max-w-xl">
              Buy airtime and data, pay electricity bills, and renew your cable
              TV subscription — instantly, using your existing balance.
            </p>
          </div>

          <Link
            href="/dashboard/pay-bills"
            className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg bg-[#F87D1F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e06b10] transition-colors"
          >
            Try it now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={`/dashboard/pay-bills?tab=${key}`}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-4 text-white transition-colors"
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
