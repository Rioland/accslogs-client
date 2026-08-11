"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const offerings = [
  {
    title: "Text / SMS",
    description:
      "Choose a service and immediately access a phone number to receive a verification code.",
    icon: MessageSquareText,
  },
  {
    title: "Voice",
    description:
      "We offer voice numbers for services which require verification via phone call.",
    icon: PhoneCall,
  },
];

const delays = [0, 100] as const;

const TextVerifySection: React.FC = () => {
  return (
    <section className="w-full bg-[#f3f1ef] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <AnimatedSection animation="fade-left" threshold={0.1}>
            <span className="inline-flex items-center rounded-full bg-[#F87D1F] px-3 py-1 text-xs font-bold tracking-wide text-white">
              NEW FEATURE
            </span>

            <h2 className="mt-4 text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              Don&apos;t want to give out your phone number?
              <span className="mt-2 block text-[#F87D1F]">
                No problem. Use ours.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Real US mobile numbers backed by physical SIMs — compatible with
              all platforms. Protect your personal information from data
              breaches and companies who resell your information.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/sms-verify"
                className="inline-flex items-center gap-2 rounded-full bg-[#194572] px-6 py-3 font-medium text-white transition hover:bg-[#123a5f]"
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/text-verify"
                className="inline-flex items-center gap-2 rounded-full border border-[#194572]/30 bg-white px-6 py-3 font-medium text-[#194572] transition hover:border-[#F87D1F]"
              >
                Get a number
              </Link>
            </div>
          </AnimatedSection>

          <div className="grid gap-4 sm:grid-cols-2">
            {offerings.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimatedSection
                  key={item.title}
                  animation="fade-up"
                  delay={delays[i]}
                >
                  <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#F87D1F]/40">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#F87D1F]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="text-lg font-semibold text-teal-800">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>

        <AnimatedSection animation="fade-up" delay={200} className="mt-10">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#194572]/15 bg-white px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#F87D1F]" />
              <p className="text-sm leading-relaxed text-gray-600">
                Use our numbers instead of yours — pay from your Topnotchlogs
                wallet and read verification codes right in your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5 text-[#F87D1F]" />
              Built for privacy
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default TextVerifySection;
