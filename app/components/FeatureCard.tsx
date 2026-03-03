"use client";

import React from "react";
import {
  ShieldCheck,
  Users,
  LineChart,
  Lock,
  Headphones,
  Shield,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 border border-gray-100">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-teal-700">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-teal-800 mb-2">{title}</h3>

      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const featureItems = [
  {
    icon: <ShieldCheck size={24} />,
    title: "Verified Accounts",
    description:
      "All accounts go through a strict verification process to ensure authenticity and quality.",
  },
  {
    icon: <Users size={24} />,
    title: "Active Engagement",
    description:
      "Accounts come with real followers and active engagement for immediate impact.",
  },
  {
    icon: <LineChart size={24} />,
    title: "Performance Metrics",
    description:
      "Detailed analytics provided for each account to help you make informed decisions.",
  },
  {
    icon: <Lock size={24} />,
    title: "Secure Transactions",
    description:
      "End-to-end encrypted payments and secure account transfer process.",
  },
  {
    icon: <Headphones size={24} />,
    title: "24/7 Support",
    description:
      "Our dedicated team is always available to assist with any questions or issues.",
  },
  {
    icon: <Shield size={24} />,
    title: "Account Guarantee",
    description:
      "30-day account guarantee to ensure your complete satisfaction.",
  },
];

const delays = [0, 100, 200, 300, 400, 500] as const;

const WhyChooseSection: React.FC = () => {
  return (
    <section className="w-full bg-[#f3f1ef] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection animation="fade-down" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-800">
            Why Choose Topnotchlogs?
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            We provide the most reliable and authentic social media accounts in
            the market.
          </p>
        </AnimatedSection>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item, i) => (
            <AnimatedSection
              key={item.title}
              animation="fade-up"
              delay={delays[i]}
            >
              <FeatureCard
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
