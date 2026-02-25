/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Navbar1 from "../components/Navbar1";
import dynamic from "next/dynamic";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

const Navbar2 = dynamic(() => import("../components/Navbar2"), { ssr: false });

export default function TermsPage() {
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#e4e9ee]">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Terms and Conditions
            </h1>

            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Welcome to Topnotchlogs.com, your marketplace for buying and
                selling social media accounts! To keep our community safe and
                informed, please read this disclaimer carefully before using our
                website or services. By accessing or using Topnotchlogs.com, you
                agree to the terms outlined below.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Nature of Services
              </h2>
              <p className="mb-6">
                Topnotchlogs.com provides a platform for users to buy and sell
                social media accounts. We act solely as a marketplace and do not
                own, create, or control the accounts listed on our site. All
                transactions are between buyers and sellers, and
                Topnotchlogs.com is not responsible for the quality,
                authenticity, or legality of the accounts sold.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. No Affiliation with Social Media Platforms
              </h2>
              <p className="mb-6">
                Topnotchlogs.com is not affiliated with, endorsed by, or
                sponsored by any social media platforms, including but not
                limited to Instagram, TikTok, Facebook, YouTube, or Twitter. The
                buying and selling of social media accounts may violate the
                terms of service of these platforms. Users are solely
                responsible for ensuring compliance with all applicable platform
                policies and assume all risks associated with account transfers.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. User Responsibility
              </h2>
              <p className="mb-4">
                <strong>Buyers:</strong> You acknowledge that purchasing a
                social media account carries risks, including account
                suspension, deactivation, or loss of access by the platform.
                Topnotchlogs.com does not guarantee the longevity, performance,
                or follower authenticity of purchased accounts.
              </p>
              <p className="mb-4">
                <strong>Sellers:</strong> You confirm that you have the legal
                right to sell the accounts you list and that all information
                provided is accurate. You are responsible for complying with all
                applicable laws and platform terms.
              </p>
              <p className="mb-6">
                <strong>All Users:</strong> You agree to use Topnotchlogs.com in
                a lawful manner and to follow our community guidelines.
                Topnotchlogs.com reserves the right to remove listings or
                terminate accounts that violate our policies or engage in
                fraudulent activity.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. No Warranties
              </h2>
              <p className="mb-6">
                All services and accounts on Topnotchlogs.com are provided
                &quot;as is&quot; and &quot;as available&quot; without
                warranties of any kind, express or implied, including but not
                limited to merchantability, fitness for a particular purpose, or
                non-infringement. We do not guarantee the accuracy,
                completeness, or reliability of any information on our site.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Limitation of Liability
              </h2>
              <p className="mb-6">
                Topnotchlogs.com is not liable for any direct, indirect,
                incidental, consequential, or punitive damages arising from your
                use of our platform, including but not limited to financial
                losses, account bans, or disputes between buyers and sellers.
                You use Topnotchlogs.com at your own risk.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Intellectual Property
              </h2>
              <p className="mb-6">
                All content on Topnotchlogs.com, including text, graphics,
                logos, and software, is the property of Quickplugz.com or its
                licensors and is protected by copyright and trademark laws. You
                may not reproduce, distribute, or modify our content without
                prior written permission. If you list accounts containing
                copyrighted material, you confirm you have the right to transfer
                such content or that its use complies with fair use provisions
                under applicable laws (e.g., Section 107 of the U.S. Copyright
                Act).
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Third-Party Content and Links
              </h2>
              <p className="mb-6">
                Topnotchlogs.com may contain user-generated content or links to
                third-party websites. We are not responsible for the accuracy,
                legality, or safety of such content or sites. Any reliance on
                third-party content or external links is at your own risk.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Affiliate and Advertising Disclosures
              </h2>
              <p className="mb-6">
                If Topnotchlogs.com promotes third-party products or services,
                we may receive compensation. Any such relationships will be
                disclosed in accordance with Federal Trade Commission (FTC)
                guidelines. Users listing accounts must disclose any affiliate
                relationships or paid promotions associated with their accounts.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Community Guidelines
              </h2>
              <p className="mb-4">
                To maintain a safe and respectful community, users must not:
              </p>
              <ul className="list-disc list-inside mb-6 ml-4">
                <li>Post fraudulent, misleading, or illegal content.</li>
                <li>Engage in harassment, hate speech, or spam.</li>
                <li>
                  Violate intellectual property rights or platform terms of
                  service.
                </li>
              </ul>
              <p className="mb-6">
                Topnotchlogs.com reserves the right to remove content or suspend
                users who violate these guidelines.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Changes to This Disclaimer
              </h2>
              <p className="mb-6">
                We may update this disclaimer at any time without prior notice.
                Changes will be posted on this page with an updated effective
                date. Your continued use of Topnotchlogs.com constitutes
                acceptance of the revised terms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Contact Us
              </h2>
              <p className="mb-6">
                If you have questions about this disclaimer or our services,
                please contact us at support@Topnotchlogs.com. For secure
                communication, avoid sharing sensitive information via social
                media.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
