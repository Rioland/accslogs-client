import React, { Suspense } from "react";
import type { Metadata } from "next";

import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Footer from "../components/Footer";
import BillPaymentsLanding from "./BillPaymentsLanding";

export const metadata: Metadata = {
  title: "Bill Payments — Buy Airtime & Data, Pay Electricity & Cable TV",
  description:
    "Buy cheap airtime and data for MTN, Glo, Airtel, 9mobile and Smile, pay electricity bills on every major disco, and renew DStv, GOtv, Startimes or Showmax. Instant delivery from your Topnotchlogs wallet.",
};

export default function BillPaymentsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar />
      <Navbar1 />

      <main className="flex-1">
        {/* The landing page reads ?service= to preselect a tab. */}
        <Suspense>
          <BillPaymentsLanding />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
