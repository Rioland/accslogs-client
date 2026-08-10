"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Headphones,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Tv,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import Wrapper from "../components/Wrapper";
import AnimatedSection from "../components/AnimatedSection";

type ServiceKey = "airtime" | "data" | "electricity" | "tv";

interface Service {
  key: ServiceKey;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  providersLabel: string;
  providers: string[];
  highlights: string[];
}

const services: Service[] = [
  {
    key: "airtime",
    label: "Airtime",
    tagline: "Top up any line",
    description:
      "Recharge any Nigerian number in seconds. Enter the number, choose an amount, and the credit lands before you close the tab.",
    icon: Smartphone,
    providersLabel: "Networks",
    providers: ["MTN", "Glo", "Airtel", "9mobile"],
    highlights: [
      "Delivered by VTU, no vouchers to scratch",
      "Top up your own line or someone else's",
      "Any amount from ₦50 upward",
    ],
  },
  {
    key: "data",
    label: "Data",
    tagline: "Every bundle, all networks",
    description:
      "Daily, weekly and monthly plans across every network, including SME bundles. You see the exact price before you pay — no surprises.",
    icon: Wifi,
    providersLabel: "Networks",
    providers: ["MTN", "Glo", "Airtel", "9mobile", "Smile"],
    highlights: [
      "Daily, weekly and monthly plans",
      "SME and gifting bundles included",
      "Activates instantly, no waiting",
    ],
  },
  {
    key: "electricity",
    label: "Electricity",
    tagline: "Tokens the moment you pay",
    description:
      "Prepaid and postpaid meters on every major disco. We confirm the registered meter name before a single naira leaves your wallet.",
    icon: Zap,
    providersLabel: "Discos",
    providers: [
      "AEDC",
      "EKEDC",
      "IKEDC",
      "IBEDC",
      "PHED",
      "KEDCO",
      "KAEDCO",
      "JED",
      "BEDC",
      "EEDC",
      "ABEDC",
      "YEDC",
    ],
    highlights: [
      "Meter name verified before you are charged",
      "Prepaid tokens delivered with your receipt",
      "Postpaid balances settled the same way",
    ],
  },
  {
    key: "tv",
    label: "Cable TV",
    tagline: "Never miss a match",
    description:
      "Renew or change your package without queues or USSD codes. We check the smartcard holder's name first, so you never pay on a wrong number.",
    icon: Tv,
    providersLabel: "Providers",
    providers: ["DStv", "GOtv", "Startimes", "Showmax"],
    highlights: [
      "Smartcard holder confirmed before payment",
      "Renew or switch package in one step",
      "Activated immediately, no call centre",
    ],
  },
];

const stats = [
  { value: "Seconds", label: "Average delivery time" },
  { value: "12", label: "Electricity discos covered" },
  { value: "5", label: "Networks for data & airtime" },
  { value: "24/7", label: "Support, every day" },
];

const steps = [
  {
    step: "01",
    title: "Fund your wallet",
    description:
      "Top up once by bank transfer to your dedicated account number. The balance is yours to spend across everything.",
    icon: Wallet,
  },
  {
    step: "02",
    title: "Pick a service",
    description:
      "Choose airtime, data, electricity or cable TV, then enter the number, meter or smartcard you are paying for.",
    icon: Receipt,
  },
  {
    step: "03",
    title: "Confirm the details",
    description:
      "For meters and smartcards we show you the registered name first, so you can stop before paying the wrong account.",
    icon: BadgeCheck,
  },
  {
    step: "04",
    title: "Get it instantly",
    description:
      "Credit, bundle or token is delivered in seconds and saved to your history with a receipt you can come back to.",
    icon: Zap,
  },
];

const reasons = [
  {
    title: "One wallet for everything",
    description:
      "The same balance that buys premium accounts pays your bills. Fund once, spend anywhere on the platform.",
    icon: Wallet,
  },
  {
    title: "Refunds happen automatically",
    description:
      "If a payment fails at the provider, the amount returns to your wallet on its own. You never have to chase us for it.",
    icon: RefreshCcw,
  },
  {
    title: "We verify before charging",
    description:
      "Meter and smartcard numbers are checked against the provider and the registered name shown to you before payment.",
    icon: ShieldCheck,
  },
  {
    title: "Delivered in seconds",
    description:
      "Everything is automated end to end. No manual approvals, no business hours, no waiting on an agent.",
    icon: Clock,
  },
  {
    title: "Every receipt kept",
    description:
      "Tokens, reference numbers and amounts are stored against your account, so you can find any past payment.",
    icon: Receipt,
  },
  {
    title: "Real people when you need them",
    description:
      "Live support every day of the year. If something looks wrong, a human will look at your specific transaction.",
    icon: Headphones,
  },
];

const faqs = [
  {
    question: "How fast is delivery, really?",
    answer:
      "Seconds. Airtime, data and cable TV activate immediately, and electricity tokens appear with your receipt as soon as the disco confirms. Nothing waits on manual approval.",
  },
  {
    question: "What happens if a payment fails?",
    answer:
      "The amount goes straight back to your wallet automatically. We only mark a payment complete once the provider confirms it, so a failure at their end reverses at ours — you do not need to open a ticket.",
  },
  {
    question: "Can I pay for someone else's meter or phone?",
    answer:
      "Yes. Enter any number, meter or smartcard. For meters and smartcards we show you the registered name before charging you, which is the easiest way to catch a typo before it costs you.",
  },
  {
    question: "How do I add money to my wallet?",
    answer:
      "You get a dedicated bank account number tied to your profile. Transfer to it from any Nigerian bank and your balance updates automatically — no uploading receipts.",
  },
  {
    question: "Do I need a separate account for bill payments?",
    answer:
      "No. If you already buy accounts on Topnotchlogs, bill payments are already in your dashboard under Pay Bills. Same login, same wallet.",
  },
];

function ServiceShowcase() {
  // Cards on the home page deep link straight to a service, e.g. ?service=data
  const requested = useSearchParams().get("service");
  const [active, setActive] = useState<ServiceKey>(
    services.some((s) => s.key === requested)
      ? (requested as ServiceKey)
      : "airtime",
  );
  const service = services.find((s) => s.key === active) ?? services[0];
  const ActiveIcon = service.icon;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {services.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              aria-pressed={isActive}
              className={[
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-5 sm:text-base",
                isActive
                  ? "bg-[#F87D1F] text-white shadow-md"
                  : "bg-white text-teal-800 ring-1 ring-gray-200 hover:ring-[#F87D1F]/50",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(25,69,114,0.10)] ring-1 ring-gray-100">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-5 md:gap-10 md:p-10">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F87D1F]">
                <ActiveIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#F87D1F]">
                  {service.tagline}
                </p>
                <h3 className="text-xl font-bold text-teal-800 sm:text-2xl">
                  {service.label}
                </h3>
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed text-gray-600">
              {service.description}
            </p>

            <ul className="mt-6 space-y-3">
              {service.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-700/10 text-teal-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-gray-700">{highlight}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/dashboard/pay-bills?tab=${service.key}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#194572] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123a5f]"
            >
              Pay {service.label.toLowerCase()} now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl bg-[#f3f1ef] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {service.providersLabel}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.providers.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-gray-200"
                  >
                    {provider}
                  </span>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                  <Clock className="h-4 w-4 text-[#F87D1F]" />
                  Instant delivery
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Paid from your wallet balance, with an automatic refund if the
                  provider declines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

const delays = [0, 100, 200, 300, 400, 500] as const;

export default function BillPaymentsLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#194572] via-[#1b4d80] to-[#0f2f4f] px-4 py-16 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <AnimatedSection animation="fade-left" threshold={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
              <span className="rounded-full bg-[#F87D1F] px-2 py-0.5 text-white">
                New
              </span>
              Bill payments
            </span>

            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Pay every bill
              <span className="block text-[#F87D1F]">in seconds</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Buy airtime and data, settle electricity bills and renew your
              cable TV — all from the wallet you already fund on Topnotchlogs.
              Automated end to end, delivered instantly, refunded automatically
              if anything fails.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard/pay-bills"
                className="inline-flex items-center gap-2 rounded-full bg-[#F87D1F] px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#e06b10]"
              >
                Start paying bills
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="#how-it-works"
                className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white hover:text-[#194572]"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#F87D1F]" />
                Verified before you pay
              </span>
              <span className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-[#F87D1F]" />
                Automatic refunds
              </span>
            </div>
          </AnimatedSection>

          {/* Product mock */}
          <AnimatedSection
            animation="fade-right"
            delay={200}
            threshold={0.1}
            className="relative"
          >
            <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-teal-800">Pay Bills</p>
                <span className="rounded-full bg-teal-700/10 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  Wallet ₦48,500
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {services.map(({ key, label, icon: Icon }, i) => (
                  <div
                    key={key}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center",
                      i === 0
                        ? "bg-[#F87D1F] text-white"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">Network</p>
                  <div className="mt-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900">
                    MTN
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Phone number
                  </p>
                  <div className="mt-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900">
                    0803 000 0000
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Amount</p>
                  <div className="mt-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900">
                    ₦2,000
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#F87D1F] py-3 text-center text-sm font-semibold text-white">
                Pay ₦2,000
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5 text-[#F87D1F]" />
                Delivered in seconds
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-white px-4 py-10 sm:px-6 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimatedSection
              key={stat.label}
              animation="fade-up"
              delay={delays[i]}
              className="text-center"
            >
              <div className="text-2xl font-bold text-[#F87D1F] sm:text-3xl md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="w-full scroll-mt-20 bg-[#f3f1ef] px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              Four services, one balance
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Pick a service to see exactly who we cover and what you get.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={100}>
            <ServiceShowcase />
          </AnimatedSection>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="w-full scroll-mt-20 bg-white px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Four steps, and only the first one is ever repeated.
            </p>
          </AnimatedSection>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ step, title, description, icon: Icon }, i) => (
              <AnimatedSection
                key={step}
                animation="fade-up"
                delay={delays[i]}
                className="h-full"
              >
                <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-[#f3f1ef] p-6 transition hover:border-[#F87D1F]/40">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#194572] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-2xl font-bold text-[#F87D1F]/30">
                      {step}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-teal-800">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="w-full bg-[#eef2f3] px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
              Why pay your bills here
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              The things that actually matter when money leaves your account.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map(({ title, description, icon: Icon }, i) => (
              <AnimatedSection
                key={title}
                animation="fade-up"
                delay={delays[i]}
                className="h-full"
              >
                <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#F87D1F]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-teal-800">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-white px-4 py-14 sm:px-6 sm:py-20 md:px-12 lg:px-20">
        <Wrapper>
          <div className="grid gap-10 md:grid-cols-3 md:gap-14">
            <AnimatedSection animation="fade-right">
              <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
                Questions, answered
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Still unsure about something? Our support team replies every day
                of the year.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F87D1F] hover:underline"
              >
                Talk to support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100} className="md:col-span-2">
              <div className="rounded-2xl border border-gray-200 px-6">
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

      {/* Final CTA */}
      <section className="w-full bg-[#f3f1ef] px-4 pb-16 sm:px-6 md:px-12 lg:px-20">
        <Wrapper>
          <AnimatedSection animation="zoom-in">
            <div className="overflow-hidden rounded-3xl bg-linear-to-r from-[#194572] to-[#1f5a92] px-6 py-12 text-center sm:px-12 sm:py-16">
              <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Your next recharge takes ten seconds
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Fund your wallet once and stop hunting for USSD codes. Airtime,
                data, electricity and cable TV, all in one place.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard/pay-bills"
                  className="inline-flex items-center gap-2 rounded-full bg-[#F87D1F] px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#e06b10]"
                >
                  Pay a bill now
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
