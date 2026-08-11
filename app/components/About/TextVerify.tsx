"use client";

import { MessageSquareText, PhoneCall, ShieldCheck, Smartphone } from "lucide-react";
import FeatureCard from "./FeatureCard";
import Wrapper from "../Wrapper";
import AnimatedSection from "../AnimatedSection";
import Link from "next/link";

const features = [
  {
    icon: <Smartphone size={32} />,
    title: "Real US mobile numbers",
    description: (
      <p>
        Numbers backed by physical SIMs and compatible with platforms that reject
        VoIP lines. Use ours instead of giving out your personal phone.
      </p>
    ),
  },
  {
    icon: <MessageSquareText size={32} />,
    title: "Text / SMS",
    description: (
      <p>
        Choose a service and immediately access a phone number to receive a
        verification code. Codes show up in your Topnotchlogs dashboard.
      </p>
    ),
  },
  {
    icon: <PhoneCall size={32} />,
    title: "Voice",
    description: (
      <p>
        We offer voice numbers for services which require verification via phone
        call — so you stay covered when text is not enough.
      </p>
    ),
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Protect your information",
    description: (
      <p>
        Keep your personal details away from data breaches and companies that
        resell phone numbers. Verify privately, paid from your wallet.
      </p>
    ),
  },
];

const delays = [0, 100, 200, 300] as const;

export default function AboutTextVerify() {
  return (
    <Wrapper>
      <section className="mb-6 min-w-full rounded-2xl bg-white px-6 py-14 shadow-lg md:min-w-7xl">
        <AnimatedSection animation="fade-down" className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full bg-[#F87D1F] px-3 py-1 text-xs font-bold tracking-wide text-white">
            NEW
          </span>

          <h2 className="mt-4 text-2xl font-bold text-[#F87D1F] md:text-3xl">
            Don&apos;t want to give out your phone number?
          </h2>
          <p className="mt-2 text-xl font-semibold text-teal-800">
            No problem. Use ours.
          </p>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gray-700">
            Real US mobile numbers backed by physical SIMs — compatible with all
            platforms. Protect your personal information from data breaches and
            companies who resell your information.
          </p>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, i) => (
            <AnimatedSection
              key={feature.title}
              animation="fade-up"
              delay={delays[i]}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection animation="fade-up" delay={200}>
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
              Choose a service, get a number from your wallet, enter it where the
              app asks, and read your verification code in the dashboard.
            </p>
            <Link
              href="/sms-verify"
              className="inline-flex items-center rounded-full bg-[#194572] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123a5f]"
            >
              Explore SMS Verify
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </Wrapper>
  );
}
