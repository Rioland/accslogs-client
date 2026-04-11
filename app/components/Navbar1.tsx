"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "./Wrapper";
import {
  ArrowDown2,
  HamburgerMenu,
  InfoCircle,
  ProfileCircle,
} from "iconsax-reactjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function Navbar1() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          <Link
            href="/contact"
            className="rounded-4xl border border-[#194572] p-2 flex flex-row items-center gap-2 hover:bg-gray-100 cursor-pointer"
          >
            <InfoCircle size="28" color="#F87D1F" variant="Bold" />
            <p className="hidden text-base font-medium text-[#194572] md:block">
              Ask a question
            </p>
          </Link>

          <div className="hidden md:flex flex-row gap-3.5">
            <Link
              href="/"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              Home
            </Link>
            <Link
              href="/market-place"
              className={`hover:text-[#F87D1F] mx-2 font-bold text-lg transition-colors ${pathname === "/market-place" ? "text-[#F87D1F]" : "text-gray-800"}`}
            >
              MarketPlace
            </Link>
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
            <Link
              href="/market-place"
              className={`rounded-lg px-2 py-2.5 text-base font-semibold transition-colors hover:bg-gray-50 hover:text-[#F87D1F] ${pathname === "/market-place" ? "text-[#F87D1F]" : "text-gray-900"}`}
            >
              MarketPlace
            </Link>
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
