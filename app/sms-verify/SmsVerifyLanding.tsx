"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageSquareText,
  PhoneCall,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

const pricingPlans = [
  {
    name: "Verifications",
    price: "₦480",
    unit: "from / verification",
    blurb:
      "Receive an SMS one-time-code (OTP) or respond to a voice call to register for ANY service, including popular services like Gmail, Tinder, and WhatsApp.",
    features: [
      "Get a Non-VoIP US phone number",
      "Register for any online service",
      "Short-term phone number reuse",
      "Receive SMS verification codes",
      "Respond to voice call verifications",
      "Choose a US area code",
    ],
    cta: "Get a number",
    href: "/dashboard/text-verify",
    featured: true,
    available: true,
  },
  {
    name: "Non-Renewable Rentals",
    price: "₦13,440",
    unit: "from / 7 days",
    blurb:
      "Rent one of our phone numbers that can be used for ANY service over a period of 1 to 14 days. Your rental will expire at the end of the chosen period.",
    features: [
      "Get a Non-VoIP US phone number",
      "Register for any online service",
      "Verify many services on a single line",
      "Own your number for 1 to 14 days",
      "Receive unlimited SMS verifications",
      "Instantly get verifications 24/7",
    ],
    cta: "Rent a number",
    href: "/dashboard/text-verify?mode=nonrenewable",
    featured: false,
    available: true,
  },
  {
    name: "Renewable Rentals",
    price: "₦19,200",
    unit: "from / 30 days",
    blurb:
      "Rent one of our phone numbers that can be used for ANY service and kept as long as you need. Pay every 30 days to keep the number.",
    features: [
      "Get a Non-VoIP US phone number",
      "Register for any online service",
      "Verify many services on a single line",
      "Own your number forever",
      "Receive unlimited SMS verifications",
      "Instantly get verifications 24/7",
      "Choose a US area code",
    ],
    cta: "Start monthly rental",
    href: "/dashboard/text-verify?mode=renewable",
    featured: false,
    available: true,
  },
];

import Wrapper from "../components/Wrapper";
import AnimatedSection from "../components/AnimatedSection";

const steps = [
  {
    step: "01",
    title: "Choose a service",
    description:
      "Pick WhatsApp, Gmail, Discord, Telegram, or any service that asks for a phone number.",
  },
  {
    step: "02",
    title: "Use our number",
    description:
      "Get a real US mobile number instantly from your wallet — ready for verification.",
  },
  {
    step: "03",
    title: "Receive your code",
    description:
      "Enter the number on the platform. Your verification code shows up in your Topnotchlogs dashboard.",
  },
  {
    step: "04",
    title: "Stay private",
    description:
      "Your personal phone stays offline. If you need to cancel, your wallet is refunded automatically.",
  },
];

const benefits = [
  {
    title: "Don't share your real number",
    description:
      "Stop handing your personal phone to every app, form, and marketplace that asks for SMS verification.",
    icon: ShieldCheck,
  },
  {
    title: "Real US mobile numbers",
    description:
      "Numbers backed by physical SIMs — compatible with platforms that reject VoIP and virtual lines.",
    icon: Smartphone,
  },
  {
    title: "One wallet for everything",
    description:
      "Fund once. Buy accounts, pay bills, and get verification numbers from the same balance.",
    icon: Wallet,
  },
  {
    title: "Codes where you already work",
    description:
      "No extra apps. Verification messages appear on your SMS Verify page as soon as they arrive.",
    icon: MessageSquareText,
  },
];

const faqs = [
  {
    question: "Why should I use your numbers instead of mine?",
    answer:
      "Every signup that asks for SMS puts your personal number in someone else's database. Our numbers let you verify without exposing yourself to spam, breaches, or data resellers.",
  },
  {
    question: "Are these real US numbers?",
    answer:
      "Yes. You get real US mobile numbers backed by physical SIMs, so they work with platforms that block VoIP numbers.",
  },
  {
    question: "What can I verify?",
    answer:
      "Text/SMS verification for supported services — messaging apps, email, social platforms, and more. Choose a service and get a number ready for your code.",
  },
  {
    question: "What if I don't receive a code?",
    answer:
      "Cancel from your dashboard and the amount returns to your wallet automatically so you can try again.",
  },
];

const delays = [0, 100, 200, 300] as const;

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-teal-800 sm:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#F87D1F] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <p className="pb-5 pr-10 text-sm leading-relaxed text-gray-600 sm:text-base">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function SmsVerifyLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-br from-[#0f2f4f] via-[#194572] to-[#1b4d80] px-4 py-16 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <AnimatedSection animation="fade-left" threshold={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
              <span className="rounded-full bg-[#F87D1F] px-2 py-0.5 text-white">
                New
              </span>
              SMS Verify
            </span>

            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Don&apos;t want to give out your phone number?
              <span className="mt-2 block text-[#F87D1F]">
                No problem. Use ours.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Real US mobile numbers backed by physical SIMs — compatible with
              all platforms. Protect your personal information from data
              breaches and companies who resell your information.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard/text-verify"
                className="inline-flex items-center gap-2 rounded-full bg-[#F87D1F] px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#e06b10]"
              >
                Get a number now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#pricing"
                className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white hover:text-[#194572]"
              >
                View pricing
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#F87D1F]" />
                Protect your privacy
              </span>
              <span className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-[#F87D1F]" />
                Auto-refund if you cancel
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="fade-right"
            delay={200}
            threshold={0.1}
            className="relative"
          >
            <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-teal-800">SMS Verify</p>
                <span className="rounded-full bg-teal-700/10 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  Ready
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">Service</p>
                  <div className="mt-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900">
                    WhatsApp
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Your number
                  </p>
                  <div className="mt-1 rounded-lg border border-gray-200 px-3 py-2.5 font-mono text-sm font-semibold text-gray-900">
                    +1 (415) 555-0198
                  </div>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs font-medium text-green-700">
                    Verification code
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-green-900">
                    482917
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
                <MessageSquareText className="h-3.5 w-3.5 text-[#F87D1F]" />
                Code delivered to your dashboard
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-14 sm:px-6 sm:py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              What we offer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
              Verification made simple — without putting your personal phone on
              the line.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 md:grid-cols-2">
            <AnimatedSection animation="fade-up" delay={0}>
              <div className="h-full rounded-3xl border border-gray-100 bg-[#f3f1ef] p-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#F87D1F] shadow-sm">
                  <MessageSquareText className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-teal-800">
                  Text / SMS
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  Choose a service and immediately access a phone number to
                  receive a verification code. Perfect for apps and websites
                  that send OTP by text.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    "Instant access to a US number",
                    "Works across major platforms",
                    "Code appears in your dashboard",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F87D1F]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <div className="h-full rounded-3xl border border-gray-100 bg-[#f3f1ef] p-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#F87D1F] shadow-sm">
                  <PhoneCall className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-teal-800">Voice</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  We offer voice numbers for services which require verification
                  via phone call — so you are covered when text is not an option.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    "Voice call verification support",
                    "Same privacy-first experience",
                    "Ideal when SMS is unavailable",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F87D1F]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="w-full scroll-mt-20 bg-[#eef2f3] px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              Great products, simple pricing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Purchase credits using our secure payment options and use the
              products that fit your needs best.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <AnimatedSection
                key={plan.name}
                animation="fade-up"
                delay={delays[i]}
                className="h-full"
              >
                <div
                  className={[
                    "flex h-full flex-col rounded-3xl border bg-white p-7 shadow-sm",
                    plan.featured
                      ? "border-[#F87D1F] ring-2 ring-[#F87D1F]/20"
                      : "border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-teal-800">
                      {plan.name}
                    </h3>
                    {plan.featured && (
                      <span className="rounded-full bg-[#F87D1F] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    )}
                    {!plan.available && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                        Soon
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Starting at...
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#F87D1F]">
                      {plan.price}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {plan.unit}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-gray-600">
                    {plan.blurb}
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F87D1F]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.available ? (
                    <Link
                      href={plan.href}
                      className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#F87D1F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e06b10]"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-8 rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-500"
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection animation="fade-up" delay={200}>
            <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-gray-500">
              Starting prices — the exact amount depends on the service you
              choose and is always shown in your dashboard before you pay. Paid
              from your Topnotchlogs wallet, in naira.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section
        id="how-it-works"
        className="w-full scroll-mt-20 bg-[#f3f1ef] px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
              From service to verification code — fast, private, and paid from
              your wallet.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, i) => (
              <AnimatedSection
                key={item.step}
                animation="fade-up"
                delay={delays[i]}
                className="h-full"
              >
                <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6">
                  <span className="text-2xl font-bold text-[#F87D1F]/35">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-teal-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              Why use our numbers
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
              Privacy, reliability, and convenience — without putting your real
              phone at risk.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map(({ title, description, icon: Icon }, i) => (
              <AnimatedSection
                key={title}
                animation="fade-up"
                delay={delays[i]}
                className="h-full"
              >
                <div className="flex h-full gap-4 rounded-2xl border border-gray-100 bg-[#f3f1ef] p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#F87D1F]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#eef2f3] px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <Wrapper>
          <div className="grid gap-10 md:grid-cols-3 md:gap-14">
            <AnimatedSection animation="fade-right">
              <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl">
                Questions, answered
              </h2>
              <p className="mt-3 text-base text-gray-600">
                Need help with a verification? Our support team is ready every
                day.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F87D1F] hover:underline"
              >
                Talk to support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <AnimatedSection
              animation="fade-up"
              delay={100}
              className="md:col-span-2"
            >
              <div className="rounded-2xl border border-gray-200 bg-white px-6">
                {faqs.map((faq, i) => (
                  <FaqItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Wrapper>
      </section>

      <section className="w-full bg-white px-4 pb-16 sm:px-6 md:px-12 lg:px-20">
        <Wrapper>
          <AnimatedSection animation="zoom-in">
            <div className="overflow-hidden rounded-3xl bg-linear-to-r from-[#194572] to-[#1f5a92] px-6 py-12 text-center sm:px-12 sm:py-16">
              <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Your personal number stays yours
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                Use our US mobile numbers for verification, keep your privacy
                intact, and finish signups without the risk.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard/text-verify"
                  className="inline-flex items-center gap-2 rounded-full bg-[#F87D1F] px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#e06b10]"
                >
                  Open SMS Verify
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white hover:text-[#194572]"
                >
                  Create a free account
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </Wrapper>
      </section>
    </>
  );
}
