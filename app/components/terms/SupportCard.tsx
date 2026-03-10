import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function SupportCard({ icon, title, description }: Props) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm p-6 w-full">
      <div className="text-orange-500 text-4xl">{icon}</div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
