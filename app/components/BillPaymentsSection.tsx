"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  ArrowRight,
  Clock,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const services = [
  {
    key: "airtime",
    label: "Airtime",
    description: "MTN, Airtel, Glo & 9mobile",
    icon: <Smartphone size={26} />,
  },
  {
    key: "data",
    label: "Data",
    description: "Every bundle, all networks",
    icon: <Wifi size={26} />,
  },
  {
    key: "electricity",
    label: "Electricity",
    description: "Prepaid & postpaid meters",
    icon: <Zap size={26} />,
  },
  {
    key: "tv",
    label: "Cable TV",
    description: "DStv, GOtv & Startimes",
    icon: <Tv size={26} />,
  },
];

const highlights = [
  { icon: <Clock size={18} />, label: "Delivered in seconds" },
  { icon: <Wallet size={18} />, label: "Paid from your wallet" },
  { icon: <ShieldCheck size={18} />, label: "Automatic refund if it fails" },
];

const delays = [0, 100, 200, 300] as const;

const BillPaymentsSection: React.FC = () => {
  return (
    <section className="w-full bg-linear-to-br from-[#194572] via-[#1b4d80] to-[#0f2f4f] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <AnimatedSection animation="fade-down" className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full bg-[#F87D1F] px-3 py-1 text-xs font-bold tracking-wide text-white">
            NEW FEATURE
          </span>

          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Pay Bills, Buy Airtime &amp; Data
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Your Topnotchlogs wallet now does more than buy accounts. Top up
            your phone, subscribe to data, settle electricity bills and renew
            your cable TV — all without leaving the platform.
          </p>
        </AnimatedSection>

        {/* Services */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <AnimatedSection
              key={service.key}
              animation="fade-up"
              delay={delays[i]}
            >
              <Link
                href={`/bill-payments?service=${service.key}#services`}
                className="group flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-6 transition hover:border-[#F87D1F]/60 hover:bg-white/15"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F87D1F] text-white">
                  {service.icon}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white">
                  {service.label}
                </h3>

                <p className="text-sm leading-relaxed text-white/70">
                  {service.description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#F87D1F]">
                  Pay now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        {/* Highlights + call to action */}
        <AnimatedSection animation="fade-up" delay={200} className="mt-12">
          <div className="flex flex-col items-center gap-8 rounded-2xl border border-white/15 bg-white/5 p-6 md:flex-row md:justify-between md:p-8">
            <ul className="grid gap-4 sm:grid-cols-3 md:gap-8">
              {highlights.map((highlight) => (
                <li
                  key={highlight.label}
                  className="flex items-center gap-2.5 text-sm text-white/90"
                >
                  <span className="text-[#F87D1F]">{highlight.icon}</span>
                  {highlight.label}
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard/pay-bills"
                className="rounded-full bg-[#F87D1F] px-6 py-3 font-medium text-white shadow-md transition hover:bg-[#e06b10]"
              >
                Start paying bills
              </Link>

              <Link
                href="/bill-payments"
                className="rounded-full border border-white/40 px-6 py-3 font-medium text-white transition hover:bg-white hover:text-[#194572]"
              >
                Learn more
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BillPaymentsSection;
