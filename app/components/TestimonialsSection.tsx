"use client";

import React from "react";
import { Star } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface TestimonialCardProps {
  rating: number;
  text: string;
  name: string;
  role: string;
}

const Stars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="mb-4 flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i && rating < i + 1;
        return (
          <Star
            key={i}
            size={16}
            className={
              filled || half
                ? "fill-[#F87D1F] text-[#F87D1F]"
                : "text-gray-300"
            }
            style={half ? { clipPath: "inset(0 50% 0 0)" } : undefined}
          />
        );
      })}
    </div>
  );
};

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  rating,
  text,
  name,
  role,
}) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <Stars rating={rating} />
      <p className="mb-6 leading-relaxed text-gray-600 italic">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#F87D1F]">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-teal-800">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
};

const testimonials = [
  {
    rating: 5,
    text: "The Instagram account I purchased from Topnotchlogs had real, active followers. My engagement skyrocketed within a week!",
    name: "Sarah Johnson",
    role: "Digital Marketer",
  },
  {
    rating: 5,
    text: "As an agency, we regularly purchase accounts from Topnotchlogs. Their verification process is unmatched in the industry.",
    name: "Michael Chen",
    role: "Marketing Agency Owner",
  },
  {
    rating: 4,
    text: "Quick delivery and excellent support. The TikTok account I bought already had a loyal following that aligned with my niche.",
    name: "Jessica Williams",
    role: "Content Creator",
  },
  {
    rating: 5,
    text: "Literally took me 2 minutes to create a bunch of anonymous accounts for Twitter & Discord using your phone verification service. Good job, guys.",
    name: "Social Media Manager",
    role: "San Francisco, USA",
  },
  {
    rating: 5,
    text: "This is hands down the best tool to bypass 2-factor OTP codes. Their numbers always work and the support team is great and has been super helpful. Also I can fund my wallet and my transactions go through really quick and my balance is updated right away.",
    name: "Digital Nomad",
    role: "Bangkok, Thailand",
  },
  {
    rating: 4.5,
    text: "I have been using Topnotchlogs numbers for several weeks now. It gives me peace of mind when ordering food and rideshares to know that I’m not giving my real number to strangers! It's super easy to use and helps a lot to protect my privacy.",
    name: "Privacy Advocate",
    role: "Las Vegas, USA",
  },
  {
    rating: 5,
    text: "Topnotchlogs provides the highest quality numbers. I have tried a bunch of other verification services but most of the time they don't work at all. I like how the numbers are non-VoIP so I can always get SMS verifications for hard to get accounts like Tinder and Bumble. The reliability is 100% worth the price!",
    name: "Online Reseller",
    role: "London, UK",
  },
  {
    rating: 5,
    text: "I've used Topnotchlogs services to scale my web application quickly and reliably and create a product that's now making me a living. They make phone verification easy and the experience has been excellent for a power user like me.",
    name: "Entrepreneur",
    role: "Bangladesh",
  },
  {
    rating: 5,
    text: "I love Topnotchlogs disposable numbers. I use their services for everything: SMS or text verifications and voice verifications. They are super responsive when you need help with the service. A+!",
    name: "Savvy Online Saver",
    role: "Hong Kong",
  },
];

const delays = [0, 100, 200, 300, 400, 500] as const;

const TestimonialsSection: React.FC = () => {
  return (
    <section className="w-full bg-[#f3f1ef] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection animation="fade-down" className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-teal-800 sm:text-3xl md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Trusted for premium accounts, bill payments, and private phone
            verification.
          </p>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimatedSection
              key={`${t.name}-${t.role}`}
              animation="fade-up"
              delay={delays[i % delays.length]}
            >
              <TestimonialCard
                rating={t.rating}
                text={t.text}
                name={t.name}
                role={t.role}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
