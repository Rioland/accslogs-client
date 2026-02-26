import { Facebook, Instagram } from "iconsax-reactjs";
import { ShieldCheck, Twitter } from "lucide-react";
import React from "react";

const PlatformCard: React.FC<{
  icon: React.ReactNode;
  label: string;
}> = ({ icon, label }) => (
  <div className="flex flex-col items-center justify-center gap-2 bg-gray-100 rounded-xl p-4 w-28 h-24">
    <div className="text-orange-500 text-xl">{icon}</div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </div>
);

const PremiumAccountsHero: React.FC = () => {
  return (
    <section className="w-full bg-[#f3f1ef] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-teal-800">
            Premium Social Accounts
            <span className="block text-orange-500">
              Verified & Ready to Use
            </span>
          </h1>

          <p className="mt-6 text-gray-600 max-w-xl leading-relaxed">
            Topnotchlogs Marketplace offers authentic, verified social media
            accounts across all major platforms. Grow your online presence
            instantly with our premium selection.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button className="bg-orange-500 hover:bg-orange-600 transition text-white font-medium px-6 py-3 rounded-full shadow-md">
              🛒 Browse Marketplace
            </button>

            <button className="border border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition font-medium px-6 py-3 rounded-full">
              How It Works
            </button>
          </div>
        </div>

        {/* Right Card */}
        <div className="relative flex justify-center md:justify-end">
          <div className="relative bg-white rounded-2xl shadow-lg p-6 w-80">
            {/* Verified Badge */}
            <div className="absolute -top-5 right-4 bg-teal-700 text-white text-sm px-4 py-1 rounded-full shadow">
              ✓ 100% Verified
            </div>

            {/* Platforms */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <a href="https://www.instagram.com/topnotchlogs?iigsh=MTZ2bmpyb3QyaWc2Yw%3D%3D&utm_source=q">
                <PlatformCard
                  icon={<Instagram size="32" color="#FF8A65" />}
                  label="Instagram"
                />
              </a>
              <a href="https://www.tiktok.com/@topnotchlogs.com">
                <PlatformCard icon={<span>🎵</span>} label="TikTok" />
              </a>
              <PlatformCard
                icon={<Twitter size="32" color="#FF8A65" />}
                label="Twitter"
              />
              <PlatformCard
                icon={<Facebook color="#FF8A65" variant="Outline" />}
                label="Facebook"
              />
            </div>

            {/* Stats */}
            <div className="mt-6 text-center">
              <p className="font-semibold text-gray-800">
                Premium Accounts Available
              </p>

              <div className="inline-block mt-3 bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium">
                500+ Verified Accounts
              </div>
            </div>

            {/* Secure Badge */}
            <div className="absolute -bottom-5 left-6 bg-orange-500 text-white px-5 py-2 rounded-full shadow-md text-sm flex flex-row gap-2 items-center">
              <ShieldCheck size="32" color="#ffffff" />{" "}
              <p>Secure Transactions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumAccountsHero;
