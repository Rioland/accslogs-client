import React from "react";
import Wrapper from "../Wrapper";

interface AboutSectionProps {
  className?: string;
}

const TopCard: React.FC<AboutSectionProps> = () => {
  return (
    <Wrapper>
      <div className="min-w-full md:min-w-7xl bg-white rounded-lg shadow-lg   my-10 p-8 md:p-12 lg:p-16">
        {/* Header / Title */}
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="
              text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
              font-extrabold tracking-tight
              bg-clip-text text-transparent 
              bg-linear-to-r from-gray-900 via-amber-600 to-amber-700
            "
          >
            About Topnotchlogs
          </h1>

          <div className="mt-6 text-xl sm:text-2xl font-semibold text-amber-700">
            Your Instant, Reliable Source for Premium Social Media & Digital
            Accounts
          </div>
        </div>

        {/* Main Content */}
        <div className="">
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

            <p className="text-gray-700 leading-relaxed">
              With a focus on{" "}
              <span className="font-semibold text-amber-700">speed</span>,{" "}
              <span className="font-semibold text-amber-700">security</span>,
              and{" "}
              <span className="font-semibold text-amber-700">
                100% customer satisfaction
              </span>
              , we&apos;re here to simplify your journey in the digital world.
            </p>
          </div>

          {/* Optional subtle stats or trust badges - can be removed if not needed */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-600">
                100%
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-1">
                Satisfaction
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-600">
                Instant
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-1">
                Delivery
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-600">
                Secure
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-1">
                Accounts
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-amber-600">
                24/7
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-1">
                Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default TopCard;
