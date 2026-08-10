"use client";
import React from "react";
import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Wrapper from "../components/Wrapper";
import Footer from "../components/Footer";
import TermsHeader from "../components/TermsHeader";
// import TableOfContents from "../components/TableOfContents";
import BulletCard from "../components/terms/BulletCard";
import ServiceGrid from "../components/terms/ServiceGrid";
import SectionHeader from "../components/terms/SectionHeader";
import DefinitionList from "../components/terms/DefinitionList";
import TermsSection from "../components/TermsSection";
import TermsBlock from "../components/terms/TermsBlock";
import SubSectionCard from "../components/terms/SubSectionCard";
import BulletList from "../components/terms/BulletList";
import SupportCard from "../components/terms/SupportCard";
import { MessageCircle } from "iconsax-reactjs";
import { Mail } from "lucide-react";

export default function Policy() {

  return (
    <div className="flex flex-col min-h-screen bg-[#e4e9ee]">
      <TopBar />
      <Navbar1 />

      <div className="flex-1 py-8">
        <Wrapper>
          <div className="  space-y-10 ">
            <TermsHeader effectiveDate="09/02/2023" lastUpdated="03/17/2025" />

            {/* <TableOfContents /> */}

            <TermsSection id={1} title="Acceptance of Terms">
              <p>
                By accessing or using the Website, you agree to be bound by
                these Terms & Conditions and all applicable laws. If you
                disagree with any part of these terms, you must immediately
                cease use of the website.
              </p>
            </TermsSection>
          </div>

          <div className="space-y-10 mt-10 mb-6">
            {/* Definitions */}
            <div className="bg-white p-8 rounded-2xl shadow">
              <SectionHeader number="2" title="Definitions" />

              <DefinitionList
                items={[
                  {
                    title: "Account(s):",
                    description:
                      "Digital social media or service accounts (e.g., Gmail, Facebook, LinkedIn) sold on the Website.",
                  },
                  {
                    title: "Buyer:",
                    description:
                      "Any individual or entity purchasing Accounts through the Website.",
                  },
                  {
                    title: "Service:",
                    description:
                      "The sale, delivery, and management of Accounts via Topnotchlogs.com.",
                  },
                ]}
              />
            </div>

            {/* Account Sales */}
            <div className="bg-white p-8 rounded-2xl shadow">
              <SectionHeader number="3" title="Account Sales" />

              <h3 className="text-xl font-semibold mt-6">
                3.1 Scope of Service
              </h3>
              <p className="text-gray-700 mt-2">
                Topnotchlogs.com sells pre-verified Accounts for platforms
                including but not limited to:
              </p>

              <ServiceGrid />

              <div className="mt-8">
                <BulletCard
                  title="3.2 Prohibited Use"
                  items={[
                    "Illegal activities (e.g., fraud, phishing, harassment)",
                    "Spam, mass mailing, or automated scraping",
                    "Circumventing platform policies or intellectual property violations",
                  ]}
                />
              </div>

              <div className="mt-6 bg-white rounded-xl shadow p-6">
                <h4 className="text-lg font-semibold">3.3 Age Restriction</h4>
                <p className="text-gray-700 mt-2">
                  Buyers must be at least 18 years old or the age of majority in
                  their jurisdiction.
                </p>
              </div>
            </div>
          </div>

          <TermsBlock number="4" title="Account Ownership & Risk">
            <SubSectionCard title="4.1 Transfer of Ownership">
              <p>
                Ownership transfers to the Buyer upon successful payment.
                Topnotchlogs.com disclaims all responsibility for:
              </p>

              <BulletList
                items={[
                  "Account suspensions, bans, or restrictions after login credentials are accessed by the Buyer.",
                  "Losses due to Buyer's failure to secure Accounts (e.g., changing passwords).",
                ]}
              />
            </SubSectionCard>

            <SubSectionCard title="4.2 Pre-Login Guarantee">
              <p>Topnotchlogs.com guarantees replacement or refund only if:</p>

              <BulletList
                items={[
                  "Accounts are non-functional or suspended before initial login.",
                  "Claims are submitted within 5 hours of purchase via support ticket.",
                ]}
              />
            </SubSectionCard>
          </TermsBlock>
          <br />

          <TermsBlock number="5" title="Payment & Refunds">
            <SubSectionCard title="5.1 Payment Terms">
              <BulletList
                items={[
                  "All transactions are final unless otherwise stated.",
                  "Accepted payment methods: Bank Transfer",
                ]}
              />
            </SubSectionCard>

            <SubSectionCard title="5.2 Refund Policy">
              <BulletList
                items={[
                  "Refunds are issued as store credit only, excluding cash or payment processor returns.",
                  "No refunds for:",
                  "Buyer negligence (e.g., post-login suspension).",
                  "Violations of platform terms by the Buyer.",
                ]}
              />
            </SubSectionCard>
          </TermsBlock>
          <br />

          <TermsBlock number="6" title="User Obligations">
            <SubSectionCard title="6.1 Compliance">
              <dl>
                <dt>Buyers agree to:</dt>
                <dd>
                  <BulletList
                    items={[
                      "Use Accounts in compliance with all platform-specific terms and laws.",
                      "Avoid proxies, VPNs, or emulators unless explicitly permitted",
                    ]}
                  />
                </dd>
              </dl>
            </SubSectionCard>

            <SubSectionCard title="6.2 Security">
              <BulletList
                items={[
                  "Immediately update Account credentials post-purchase.",
                  "Store downloaded Account details securely; expired orders (30+ days) cannot be restored.",
                ]}
              />
            </SubSectionCard>
          </TermsBlock>
          <br />
          <TermsBlock number="7" title="Intellectual Property">
            <BulletList
              items={[
                "All text, logos, and graphics are owned by Topnotchlogs.com and protected under copyright law. Unauthorized use is prohibited.",
                "Topnotchlogs.com claims no affiliation with social media platforms (e.g., Facebook, Twitter). Accounts are sold as standalone digital assets.",
              ]}
            />
          </TermsBlock>

          <br />
          <TermsBlock number="8" title="Disclaimers">
            <SubSectionCard title="8.1 No Warranties">
              <dl>
                <dt>
                  Accounts are provided &quot;as-is.&quot; Topnotchlogs.com
                  makes no warranties regarding:
                </dt>
                <dd>
                  <BulletList
                    items={[
                      "Longevity, functionality, or legality of Accounts.",
                      "Compatibility with third-party platforms",
                    ]}
                  />
                </dd>
              </dl>
            </SubSectionCard>
            <SubSectionCard title="8.2 Limitation of Liability">
              <dl>
                <dt>Topnotchlogs.com shall not be liable for:</dt>
                <dd>
                  <BulletList
                    items={[
                      "Indirect, incidental, or consequential damages (e.g., lost profits).",
                      "Account suspensions or losses due to Buyer actions.",
                    ]}
                  />
                </dd>
              </dl>
            </SubSectionCard>
          </TermsBlock>

          <br />
          <TermsBlock number="9" title="Privacy & Data Protection">
            <BulletList
              items={[
                "Our Privacy Policy governs data collection, use, and protection.",
                "Buyer data is retained only as necessary for order fulfillment and legal compliance.",
              ]}
            />
          </TermsBlock>
          <br />

          <TermsBlock number="10" title="Termination">
            <dl>
              <dt>Topnotchlogs.com reserves the right to:</dt>
              <dd>
                <BulletList
                  items={[
                    "Suspend or terminate Buyer access for violations of these Terms.",
                    "Discontinue the Service or Website at any time without notice.",
                  ]}
                />
              </dd>
            </dl>
          </TermsBlock>
          <br />
          <TermsBlock number="11" title="Contact Us">
            <BulletList
              items={[
                "Mediation: Disputes shall first be resolved through good-faith negotiation or mediation.",
              ]}
            />
          </TermsBlock>
          <br />
          <TermsBlock number="12" title="Amendments">
            <BulletList
              items={[
                "Topnotchlogs may revise these Terms at any time. Continued use after changes constitutes acceptance. Users are responsible for reviewing Terms periodically.",
              ]}
            />
          </TermsBlock>
          <br />
          <TermsBlock number="13" title="Contact Information">
            <dl>
              <dt>For questions or disputes:</dt>
              <dd>
                <div className="grid md:grid-cols-2 gap-6">
                  <SupportCard
                    icon={<MessageCircle size={40} />}
                    title="24/7 Support"
                    description="Live chat via Topnotchlogs.com"
                  />

                  <SupportCard
                    icon={<Mail size={40} />}
                    title="Email"
                    description="support@topnotchlogs.com"
                  />
                </div>
              </dd>
            </dl>
          </TermsBlock>
          <br />
          <TermsBlock number="14" title="Entire Agreement">
            <BulletList
              items={[
                "These Terms constitute the entire agreement between Topnotchlogs and the Buyer, superseding prior agreements or understandings.",
              ]}
            />
          </TermsBlock>

          {/*  */}
        </Wrapper>
      </div>
      <Footer />
    </div>
  );
}
