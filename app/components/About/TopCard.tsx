"use client";

import React from "react";
import Wrapper from "../Wrapper";
import AnimatedSection from "../AnimatedSection";

interface AboutSectionProps {
  className?: string;
}

const stats = [
  { value: "100%", label: "Satisfaction" },
  { value: "Instant", label: "Delivery" },
  { value: "Secure", label: "Accounts" },
  { value: "24/7", label: "Support" },
];

const delays = [0, 100, 200, 300] as const;

const TopCard: React.FC<AboutSectionProps> = () => {
  return (
    <Wrapper>
      <div className="min-w-full md:min-w-7xl bg-white rounded-lg shadow-lg my-10 p-8 md:p-12 lg:p-16">
        {/* Header / Title */}
        <AnimatedSection
          animation="fade-down"
          className="text-center mb-12 md:mb-16"
        >
          <h1
            className="
              text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
              font-extrabold tracking-tight
              bg-clip-text text-transparent 
              bg-linear-to-r from-gray-900 via-[#194572] to-[#F87D1F]
            "
          >
            About Topnotchlogs
          </h1>

          <div className="mt-6 text-xl sm:text-2xl font-semibold text-[#F87D1F]">
            Your Instant, Reliable Source for Premium Social Media &amp; Digital
            Accounts
          </div>
        </AnimatedSection>

        {/* Main Content */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="prose prose-lg md:prose-xl lg:prose-2xl prose-gray mx-auto text-center">
            <p className="text-gray-700 leading-relaxed mb-8">
              At Topnotchlogs, we empower individuals and businesses with
              instant access to verified social media and digital accounts
              across platforms like
            </p>

            <p className="font-medium text-gray-800 mb-8">
              Gmail, Facebook, Twitter, LinkedIn, Tinder, Snapchat, Discord,
              Reddit, Apple ID, Telegram, and many more.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              And with our new{" "}
              <span className="font-semibold text-[#F87D1F]">
                bill payments
              </span>{" "}
              service, that same wallet also covers your airtime, data,
              electricity and cable TV.
            </p>

            <p className="text-gray-700 leading-relaxed">
              With a focus on{" "}
              <span className="font-semibold text-[#F87D1F]">speed</span>,{" "}
              <span className="font-semibold text-[#F87D1F]">security</span>,
              and{" "}
              <span className="font-semibold text-[#F87D1F]">
                100% customer satisfaction
              </span>
              , we&apos;re here to simplify your journey in the digital world.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <AnimatedSection
                key={stat.label}
                animation="zoom-in"
                delay={delays[i]}
              >
                <div className="text-3xl md:text-4xl font-bold text-[#F87D1F]">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 mt-1">
                  {stat.label}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </Wrapper>
  );
};

export default TopCard;
