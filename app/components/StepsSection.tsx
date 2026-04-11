"use client";

import React from "react";
import { UserPlus, Search, CreditCard, CheckCircle } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  title,
  description,
  icon,
}) => {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Icon Circle */}
      <div className="z-10 w-20 h-20 rounded-full border-4 border-[#F87D1F] bg-white flex items-center justify-center text-[#F87D1F] shadow-sm">
        {icon}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 mt-6 w-full max-w-xs">
        <p className="text-[#F87D1F] font-semibold mb-1">{step}</p>
        <h3 className="text-teal-800 font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const steps = [
  {
    step: "Step 1",
    title: "Create Account",
    description: "Sign up for a free Topnotchlogs account.",
    icon: <UserPlus size={28} />,
  },
  {
    step: "Step 2",
    title: "Browse Marketplace",
    description: "Explore our verified social media accounts on Topnotchlogs.",
    icon: <Search size={28} />,
  },
  {
    step: "Step 3",
    title: "Secure Payment",
    description: "Complete your purchase securely.",
    icon: <CreditCard size={28} />,
  },
  {
    step: "Step 4",
    title: "Instant Access",
    description: "Receive account credentials immediately.",
    icon: <CheckCircle size={28} />,
  },
];

const delays = [0, 100, 200, 300] as const;

const StepsSection: React.FC = () => {
  return (
    <section className="w-full bg-[#eef2f3] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <AnimatedSection animation="fade-down" className="mb-14 text-center">
          <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
            Get Started in 4 Simple Steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Our streamlined process makes acquiring premium accounts effortless.
          </p>
        </AnimatedSection>

        {/* Steps */}
        <div className="relative grid md:grid-cols-4 gap-10">
          {/* Connecting Line (desktop) */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-1 bg-[#F87D1F]/60 z-0" />

          {steps.map((s, i) => (
            <AnimatedSection key={s.step} animation="fade-up" delay={delays[i]}>
              <StepCard
                step={s.step}
                title={s.title}
                description={s.description}
                icon={s.icon}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
