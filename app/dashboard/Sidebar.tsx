"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  PlusCircle,
  Wallet,
  ShoppingCart,
  Ticket,
  Users,
  RotateCcw,
  // FileText,
  // DollarSign,
  // SlidersHorizontal,
  User,
  LogOut,
  LucideIcon,
} from "lucide-react";
import supabaseClient from "@/lib/supabaseClient";

interface SidebarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
}

interface SidebarProps {
  activeKey: string;
  onChange?: (key: string) => void;
  items?: SidebarItem[];
}

export default function Sidebar({ activeKey, onChange, items }: SidebarProps) {
  const [funds, setFunds] = useState<number>(0);

  useEffect(() => {
    const fetchFunds = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("funds")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setFunds(profile.funds || 0);
        }
      }
    };

    fetchFunds();
  }, []);

  const defaultItems: SidebarItem[] = useMemo(
    () => [
      { key: "home", label: "Home", icon: Home, path: "/dashboard" },
      {
        key: "add-funds",
        label: "Add Funds",
        icon: Wallet,
        path: "/dashboard/add-funds",
      },
      {
        key: "my-orders",
        label: "My Orders",
        icon: ShoppingCart,
        path: "/dashboard/my-orders",
      },
      {
        key: "tickets",
        label: "Tickets",
        icon: Ticket,
        path: "/dashboard/tickets",
      },
      {
        key: "referral",
        label: "Referral Program",
        icon: Users,
        path: "/dashboard/referral",
      },
      {
        key: "transaction-history",
        label: "Transactions History",
        icon: RotateCcw,
        path: "/dashboard/transaction-history",
      },
      // { key: "balance-history", label: "Balance History", icon: FileText, path: "/dashboard/balance-history" },
      // { key: "payouts", label: "Payouts", icon: DollarSign, path: "/dashboard/payouts" },
      // { key: "manual-transactions", label: "Manual Transactions", icon: SlidersHorizontal, path: "/dashboard/manual-transactions" },
      {
        key: "profile",
        label: "Profile",
        icon: User,
        path: "/dashboard/profile",
      },
      { key: "sign-out", label: "Sign out", icon: LogOut },
    ],
    [],
  );

  const sidebarItems = items || defaultItems;

  return (
    <aside className="w-full md:w-[320px] md:shrink-0 p-4 md:sticky md:top-0 md:h-screen">
      {/* Funds header */}
      <div className="rounded-xl bg-[#194572] text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm opacity-85">Total Funds:</div>
          <div className="text-sm font-semibold">
            ₦ {funds.toLocaleString()}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#F87D1F] hover:bg-[#e06b10] transition-colors"
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
          {sidebarItems.map((item) => {
            const { key, label, icon: Icon, path } = item;
            const isActive = key === activeKey;
            if (path) {
              return (
                <Link
                  key={key}
                  href={path}
                  className={[
                    "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-[#F87D1F] text-white"
                      : "text-gray-700 hover:bg-orange-50 hover:text-[#F87D1F]",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={"h-5 w-5"} />
                  <span>{label}</span>
                </Link>
              );
            } else {
              return (
                <a
                  key={key}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onChange?.(key);
                  }}
                  className={[
                    "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-[#F87D1F] text-white"
                      : "text-gray-700 hover:bg-orange-50 hover:text-[#F87D1F]",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={"h-5 w-5"} />
                  <span>{label}</span>
                </a>
              );
            }
          })}
        </nav>
      </div>
    </aside>
  );
}
