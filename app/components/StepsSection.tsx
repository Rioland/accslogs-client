import React from "react";
import { UserPlus, Search, CreditCard, CheckCircle } from "lucide-react";

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

const StepsSection: React.FC = () => {
  return (
    <section className="w-full bg-[#eef2f3] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-800">
            Get Started in 4 Simple Steps
          </h2>

          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Our streamlined process makes acquiring premium accounts effortless.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-4 gap-10">
          {/* Connecting Line (desktop) */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-1 bg-[#F87D1F]/60 z-0" />

          <StepCard
            step="Step 1"
            title="Create Account"
            description="Sign up for a free Topnotchlogs account."
            icon={<UserPlus size={28} />}
          />

          <StepCard
            step="Step 2"
            title="Browse Marketplace"
            description="Explore our verified social media accounts on Topnotchlogs."
            icon={<Search size={28} />}
          />

          <StepCard
            step="Step 3"
            title="Secure Payment"
            description="Complete your purchase securely."
            icon={<CreditCard size={28} />}
          />

          <StepCard
            step="Step 4"
            title="Instant Access"
            description="Receive account credentials immediately."
            icon={<CheckCircle size={28} />}
          />
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
