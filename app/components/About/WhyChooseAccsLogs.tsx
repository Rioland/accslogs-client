import {
  Zap,
  CheckCircle,
  Headphones,
  Settings,
  Lock,
  Globe,
} from "lucide-react";
import FeatureCard from "./FeatureCard";
import Wrapper from "../Wrapper";

export default function WhyChooseAccsZone() {
  return (
    <Wrapper>
      <section className="bg-gray-100 py-14 px-6 rounded-2xl shadow-lg mb-6 min-w-full md:min-w-7xl">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[#F87D1F] mb-12">
          Why Choose Topnotchlogs?
        </h2>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap size={32} />}
            title="Instant Delivery, Zero Wait Times"
            description={
              <p>
                After payment, your accounts are delivered automatically within
                seconds. No delays, no manual approvals—just seamless access.
              </p>
            }
          />

          <FeatureCard
            icon={<CheckCircle size={32} />}
            title="100% Satisfaction Guarantee"
            description={
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Pre-Login Protection:</strong> Invalid, suspended, or
                  mismatched accounts are replaced or refunded immediately.
                </li>
                <li>
                  <strong>Post-Login Responsibility:</strong> Secure credentials
                  immediately—suspensions after login are beyond our control.
                </li>
              </ul>
            }
          />

          <FeatureCard
            icon={<Headphones size={32} />}
            title="24/7 Live Chat Support, 365 Days"
            description={
              <p>
                No matter your time zone, our team is always ready to assist.
                Issues are resolved in under 2 hours.
              </p>
            }
          />

          <FeatureCard
            icon={<Settings size={32} />}
            title="Fully Automated Platform"
            description={
              <ol className="list-decimal pl-5 space-y-2">
                <li>Deposit Funds: Securely top up your balance.</li>
                <li>Buy Instantly: Browse, pay, and download instantly.</li>
                <li>
                  Manage Orders: Access all purchases in your “Orders” section.
                </li>
              </ol>
            }
          />

          <FeatureCard
            icon={<Lock size={32} />}
            title="Security First"
            description={
              <ul className="list-disc pl-5 space-y-2">
                <li>Change credentials immediately after purchase.</li>
                <li>
                  Avoid spam, proxies, or emulators to extend account life.
                </li>
              </ul>
            }
          />

          <FeatureCard
            icon={<Globe size={32} />}
            title="Global Accessibility"
            description={
              <ul className="list-disc pl-5 space-y-2">
                <li>All time zones welcome—automation runs 24/7.</li>
                <li>Multilingual support: Coming soon!</li>
              </ul>
            }
          />
        </div>
      </section>
    </Wrapper>
  );
}
