import { Users, Mail, Apple } from "lucide-react";
import ServiceCard from "./ServiceCard";

export default function ServiceGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <ServiceCard
        icon={<Users />}
        title="Social Media"
        description="Facebook, Twitter/X, TikTok, LinkedIn, Snapchat, Reddit, Badoo, POF, Tinder"
      />

      <ServiceCard
        icon={<Mail />}
        title="Email & Communication"
        description="Gmail, Yahoo, Outlook, Telegram, Discord"
      />

      <ServiceCard icon={<Apple />} title="Other" description="Apple ID" />
    </div>
  );
}
