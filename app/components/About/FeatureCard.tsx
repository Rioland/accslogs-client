import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#F87D1F]/30 p-6 shadow-sm hover:shadow-md transition">
      <div className="text-[#F87D1F] mb-4">{icon}</div>

      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      <div className="text-sm text-gray-700 space-y-2">{description}</div>
    </div>
  );
}
