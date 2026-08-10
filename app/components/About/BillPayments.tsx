"use client";

import { Smartphone, Wifi, Zap, Tv } from "lucide-react";
import FeatureCard from "./FeatureCard";
import Wrapper from "../Wrapper";
import AnimatedSection from "../AnimatedSection";

const services = [
  {
    icon: <Smartphone size={32} />,
    title: "Airtime Top-Up",
    description: (
      <p>
        Recharge any MTN, Airtel, Glo or 9mobile line in seconds. Enter the
        number, pick an amount, and the credit lands immediately.
      </p>
    ),
  },
  {
    icon: <Wifi size={32} />,
    title: "Data Bundles",
    description: (
      <p>
        Daily, weekly and monthly plans across every network, priced clearly
        before you pay. No hidden charges, no waiting for activation.
      </p>
    ),
  },
  {
    icon: <Zap size={32} />,
    title: "Electricity Bills",
    description: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Prepaid and postpaid meters on all major discos.</li>
        <li>We verify the meter name before any money leaves your wallet.</li>
        <li>Your token is delivered with the receipt.</li>
      </ul>
    ),
  },
  {
    icon: <Tv size={32} />,
    title: "Cable TV Subscriptions",
    description: (
      <p>
        Renew or change your DStv, GOtv and Startimes package without queues.
        We confirm the smartcard holder&apos;s name before charging you.
      </p>
    ),
  },
];

const delays = [0, 100, 200, 300] as const;

export default function AboutBillPayments() {
  return (
    <Wrapper>
      <section className="bg-gray-100 py-14 px-6 rounded-2xl shadow-lg mb-6 min-w-full md:min-w-7xl">
        {/* Title */}
        <AnimatedSection animation="fade-down" className="text-center mb-12">
          <span className="inline-flex items-center rounded-full bg-[#F87D1F] px-3 py-1 text-xs font-bold tracking-wide text-white">
            NEW
          </span>

          <h2 className="mt-4 text-2xl md:text-3xl font-bold text-[#F87D1F]">
            Bill Payments, Airtime &amp; Data
          </h2>

          <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
            Topnotchlogs is no longer only a marketplace for digital accounts.
            The same wallet you fund to buy accounts now settles your everyday
            bills, so one balance covers everything you need.
          </p>
        </AnimatedSection>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service, i) => (
            <AnimatedSection
              key={service.title}
              animation="fade-up"
              delay={delays[i]}
            >
              <FeatureCard
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            </AnimatedSection>
          ))}
        </div>

        {/* Reassurance */}
        <AnimatedSection animation="fade-up" delay={200}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-gray-600">
            Every payment is funded from your existing balance and confirmed
            with the provider before it is marked complete. If a transaction
            fails at any point, the amount is refunded to your wallet
            automatically — you never have to chase us for it.
          </p>
        </AnimatedSection>
      </section>
    </Wrapper>
  );
}
