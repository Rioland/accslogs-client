"use client";

import { Facebook, Instagram } from "iconsax-reactjs";
import { ShieldCheck, Twitter } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import AnimatedSection from "./AnimatedSection";

const PlatformCard: React.FC<{
  icon: React.ReactNode;
  label: string;
}> = ({ icon, label }) => (
  <div className="flex flex-col items-center justify-center gap-2 bg-gray-100 rounded-xl p-4 w-28 h-24">
    <div className="text-[#F87D1F] text-xl">{icon}</div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </div>
);

const PremiumAccountsHero: React.FC = () => {
  const router = useRouter();
  return (
    <section className="w-full bg-[#f3f1ef] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-12">
        {/* Left Content */}
        <AnimatedSection animation="fade-left" threshold={0.1}>
          <h1 className="text-3xl font-bold leading-tight text-teal-800 sm:text-4xl md:text-5xl lg:text-6xl">
            Premium Social Accounts
            <span className="block text-[#F87D1F]">
              Verified &amp; Ready to Use
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Topnotchlogs Marketplace offers authentic, verified social media
            accounts across all major platforms. Grow your online presence
            instantly with our premium selection.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button className="bg-[#F87D1F] hover:bg-[#e06b10] transition text-white font-medium px-6 py-3 rounded-full shadow-md" onClick={() => router.push("/market-place")}>
               Browse Marketplace
            </button>

            <button
              className="border border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition font-medium px-6 py-3 rounded-full"
              onClick={() => router.push("/about")}
            >
              How It Works
            </button>
          </div>
        </AnimatedSection>

        {/* Right Card */}
        <AnimatedSection
          animation="fade-right"
          delay={200}
          threshold={0.1}
          className="relative flex justify-center md:justify-end"
        >
          <div className="relative mx-auto w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg sm:p-6 md:mx-0 md:max-w-[20rem]">
            {/* Verified Badge */}
            <div className="absolute -top-5 right-4 bg-teal-700 text-white text-sm px-4 py-1 rounded-full shadow">
              ✓ 100% Verified
            </div>

            {/* Platforms */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <a href="https://www.instagram.com/topnotchlogs?iigsh=MTZ2bmpyb3QyaWc2Yw%3D%3D&utm_source=q">
                <PlatformCard
                  icon={<Instagram size="32" color="#F87D1F" />}
                  label="Instagram"
                />
              </a>
              <a href="https://www.tiktok.com/@topnotchlogs.com">
                <PlatformCard icon={<span>🎵</span>} label="TikTok" />
              </a>
              <PlatformCard
                icon={<Twitter size="32" color="#F87D1F" />}
                label="Twitter"
              />
              <PlatformCard
                icon={<Facebook color="#F87D1F" variant="Outline" />}
                label="Facebook"
              />
            </div>

            {/* Stats */}
            <div className="mt-6 text-center">
              <p className="font-semibold text-gray-800">
                Premium Accounts Available
              </p>

              <div className="inline-block mt-3 bg-orange-100 text-[#F87D1F] px-4 py-1 rounded-full text-sm font-medium">
                500+ Verified Accounts
              </div>
            </div>

            {/* Secure Badge */}
            <div className="absolute -bottom-5 left-6 bg-[#F87D1F] text-white px-5 py-2 rounded-full shadow-md text-sm flex flex-row gap-2 items-center">
              <ShieldCheck size="32" color="#ffffff" />{" "}
              <p>Secure Transactions</p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default PremiumAccountsHero;
