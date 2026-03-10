import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function ServiceCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex gap-4">
      <div className="text-orange-500 text-2xl">{icon}</div>

      <div>
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
