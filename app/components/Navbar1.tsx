"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "./Wrapper";
import {
  ArrowDown2,
  Call,
  HamburgerMenu,
  ProfileCircle,
} from "iconsax-reactjs";
import {
  Bitcoin,
  ChevronDown,
  Gift,
  Receipt,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import supabase from "@/lib/supabaseClient";

interface ProductItem {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Omitted while the product is still being built. */
  href?: string;
  badge?: string;
}

const productItems: ProductItem[] = [
  {
    label: "Marketplace",
    description: "Verified social & digital accounts",
    icon: Store,
    href: "/market-place",
  },
  {
    label: "Bill Payment",
    description: "Airtime, data, electricity & cable TV",
    icon: Receipt,
    href: "/bill-payments",
  },
  {
    label: "SMS Verify",
    description: "Real US numbers for verification codes",
    icon: Smartphone,
    href: "/sms-verify",
    badge: "NEW",
  },
  {
    label: "Crypto Exchange",
    description: "Buy and sell digital currency",
    icon: Bitcoin,
    badge: "SOON",
  },
  {
    label: "Gift Cards",
    description: "Buy and sell gift cards",
    icon: Gift,
    badge: "SOON",
  },
];

export default function Navbar1() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const pathname = usePathname();

  const isProductsActive = productItems.some(
    (item) => item.href && pathname.startsWith(item.href),
  );

  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setIsAuthed(!!session);
      },
    );
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <div className="w-full bg-white py-2 shadow-sm">
      <Wrapper>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-3">
            {/* Site branding. Lives here rather than in Navbar2, which is now
                only rendered on the marketplace. */}
            <Link href="/" className="shrink-0" aria-label="Topnotchlogs home">
              <Image
                src="/images/logo.png"
                alt="Topnotchlogs"
                width={64}
                height={64}
                priority
                className="h-12 w-12 object-contain md:h-16 md:w-16"
              />
            </Link>

            <Link
              href="/contact"
              className="rounded-4xl border border-[#194572] p-2 flex flex-row items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <Call size="28" color="#F87D1F" variant="Bold" />
              <p className="hidden text-base font-medium text-[#194572] md:block">
                Contact us
              </p>
            </Link>
          </div>

          <div className="hidden md:flex flex-row items-center gap-3.5">
            <Link
              href="/"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setIsProductsOpen(true)}
              onMouseLeave={() => setIsProductsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                aria-expanded={isProductsOpen}
                aria-haspopup="true"
                className={`mx-2 flex cursor-pointer flex-row items-center gap-1 text-lg font-bold transition-colors hover:text-[#F87D1F] ${isProductsActive || isProductsOpen ? "text-[#F87D1F]" : "text-gray-800"}`}
              >
                Products
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${isProductsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProductsOpen && (
                // Padding rather than margin keeps the hover target unbroken.
                <div className="absolute left-0 top-full z-20 pt-3">
                  <div className="w-80 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                    {productItems.map(
                      ({ label, description, icon: Icon, href, badge }) => {
                        const content = (
                          <>
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${href ? "bg-orange-50 text-[#F87D1F]" : "bg-gray-100 text-gray-400"}`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>

                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`text-base font-semibold ${href ? "text-gray-900" : "text-gray-400"}`}
                                >
                                  {label}
                                </span>
                                {badge && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge === "NEW" ? "bg-[#F87D1F] text-white" : "bg-gray-200 text-gray-500"}`}
                                  >
                                    {badge}
                                  </span>
                                )}
                              </span>
                              <span
                                className={`mt-0.5 block text-sm ${href ? "text-gray-500" : "text-gray-400"}`}
                              >
                                {description}
                              </span>
                            </span>
                          </>
                        );

                        if (!href) {
                          return (
                            <div
                              key={label}
                              className="flex cursor-not-allowed items-start gap-3 rounded-lg p-3"
                              title="Coming soon"
                            >
                              {content}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={label}
                            href={href}
                            onClick={() => setIsProductsOpen(false)}
                            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50"
                          >
                            {content}
                          </Link>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/about" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/contact" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              Contact
            </Link>
            <Link
              href="/faq"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/faq" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              FAQ
            </Link>
          </div>

          <div className="flex flex-row items-center gap-2">
            <button
              className="md:hidden cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              <HamburgerMenu size="32" color="#F87D1F" />
            </button>

            {isAuthed ? (
              <Link
                href="/dashboard"
                className="hidden text-gray-800 mx-2 font-bold text-lg md:flex flex-row gap-2.5 items-center justify-between border border-[#F87D1F] rounded-4xl p-2 hover:bg-orange-50 cursor-pointer transition-colors"
              >
                <div className="flex flex-row items-center gap-2.5">
                  <ProfileCircle size="32" color="#F87D1F" variant="Bold" />
                  <p className="text-[#F87D1F]">Dashboard</p>
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:flex text-[#194572] hover:text-[#194572] mx-2 font-bold text-lg md:px-10 border border-[#194572] rounded-4xl p-2 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="hidden md:flex text-white bg-[#F87D1F] hover:bg-[#e06b10] mx-2 font-bold md:px-10 text-lg rounded-4xl p-2 cursor-pointer transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        {isOpen && (
          <div className="mt-4 flex flex-col gap-1 border-t border-gray-100 pt-4 md:hidden">
            <Link
              href="/"
              className={`rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${pathname === "/" ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
              aria-expanded={isMobileProductsOpen}
              className={`flex items-center justify-between rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${isProductsActive ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              Products
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isMobileProductsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMobileProductsOpen && (
              <div className="ml-3 flex flex-col gap-1 border-l border-gray-100 pl-3">
                {productItems.map(
                  ({ label, description, icon: Icon, href, badge }) => {
                    const inner = (
                      <>
                        <Icon
                          className={`mt-0.5 h-5 w-5 shrink-0 ${href ? "text-[#F87D1F]" : "text-gray-400"}`}
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              className={`text-base font-semibold ${href ? "text-gray-900" : "text-gray-400"}`}
                            >
                              {label}
                            </span>
                            {badge && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge === "NEW" ? "bg-[#F87D1F] text-white" : "bg-gray-200 text-gray-500"}`}
                              >
                                {badge}
                              </span>
                            )}
                          </span>
                          <span
                            className={`mt-0.5 block text-sm ${href ? "text-gray-500" : "text-gray-400"}`}
                          >
                            {description}
                          </span>
                        </span>
                      </>
                    );

                    if (!href) {
                      return (
                        <div
                          key={label}
                          className="flex cursor-not-allowed items-start gap-2.5 rounded-lg px-2 py-2"
                        >
                          {inner}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                      >
                        {inner}
                      </Link>
                    );
                  },
                )}
              </div>
            )}
            <Link
              href="/about"
              className={`rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${pathname === "/about" ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${pathname === "/contact" ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              Contact
            </Link>
            <Link
              href="/faq"
              className={`rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${pathname === "/faq" ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              FAQ
            </Link>
            {/* dashboard / auth items */}
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="flex flex-row items-center justify-between gap-2.5 rounded-2xl border border-[#F87D1F] p-3 font-semibold text-gray-900 transition-colors hover:bg-orange-50"
              >
                <div className="flex flex-row items-center gap-2.5">
                  <ProfileCircle size="32" color="#F87D1F" variant="Bold" />
                  <p className="text-[#F87D1F]">Dashboard</p>
                </div>
                <ArrowDown2 size="32" color="#F87D1F" variant="Bold" />
              </Link>
            ) : (
              <div className="mt-1 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl border border-[#194572] p-3 text-center text-base font-semibold text-[#194572] transition-colors hover:bg-blue-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl bg-[#F87D1F] p-3 text-center text-base font-semibold text-white transition-colors hover:bg-[#e06b10]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </Wrapper>
    </div>
  );
}
