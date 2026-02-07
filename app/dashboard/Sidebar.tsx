"use client";

import { useMemo } from "react";
import {
  Home,
  PlusCircle,
  Wallet,
  ShoppingCart,
  Ticket,
  Users,
  RotateCcw,
  FileText,
  DollarSign,
  SlidersHorizontal,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Sidebar({ activeKey, onChange }: SidebarProps) {
  const items = useMemo(
    () => [
      { key: "home", label: "Home", icon: Home },
      { key: "add-funds", label: "Add Funds", icon: Wallet },
      { key: "my-orders", label: "My Orders", icon: ShoppingCart },
      { key: "tickets", label: "Tickets", icon: Ticket },
      { key: "referral", label: "Referral Program", icon: Users },
      { key: "transaction-history", label: "Transactions History", icon: RotateCcw },
      { key: "balance-history", label: "Balance History", icon: FileText },
      { key: "payouts", label: "Payouts", icon: DollarSign },
      { key: "manual-transactions", label: "Manual Transactions", icon: SlidersHorizontal },
      { key: "profile", label: "Profile", icon: User },
      { key: "sign-out", label: "Sign out", icon: LogOut },
    ],
    []
  );

  return (
    <aside className="w-full md:w-[320px] md:shrink-0 p-4 md:sticky md:top-0 md:h-screen">
      {/* Funds header */}
      <div className="rounded-xl bg-neutral-800 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm opacity-85">Total Funds:</div>
          <div className="text-sm font-semibold">$ 0.00</div>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors"
            aria-label="Add funds"
            onClick={(e) => e.preventDefault()}
          >
            <PlusCircle className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-2 rounded-xl bg-white border border-gray-200 shadow-[0_6px_24px_rgba(0,0,0,0.08)] overflow-hidden">
        <nav className="py-1">
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeKey;
            return (
              <a
                key={key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(key);
                }}
                className={[
                  "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/90 text-white"
                    : "text-gray-700 hover:bg-amber-50 hover:text-gray-900",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={"h-5 w-5"} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
