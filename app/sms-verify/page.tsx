import React from "react";
import type { Metadata } from "next";

import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Footer from "../components/Footer";
import SmsVerifyLanding from "./SmsVerifyLanding";

export const metadata: Metadata = {
  title: "SMS Verify — Real US Numbers for Verification Codes",
  description:
    "Don't want to give out your phone number? Use ours. Real US mobile numbers backed by physical SIMs for Text/SMS and voice verification — paid from your Topnotchlogs wallet.",
};

export default function SmsVerifyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar />
      <Navbar1 />

      <main className="flex-1">
        <SmsVerifyLanding />
      </main>

      <Footer />
    </div>
  );
}
