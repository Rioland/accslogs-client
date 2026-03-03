import React from "react";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  rating: number;
  text: string;
  name: string;
  role: string;
}

const Stars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < rating ? "text-[#F87D1F] fill-[#F87D1F]" : "text-gray-300"
          }
        />
      ))}
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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-6">
      <Stars rating={rating} />

      <p className="text-gray-600 leading-relaxed italic mb-6">{text}</p>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />

        <div>
          <p className="font-semibold text-teal-800">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  return (
    <section className="w-full bg-[#f3f1ef] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-800">
            What Our Customers Say
          </h2>

          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Trusted by thousands of digital marketers and influencers.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            rating={5}
            text="The Instagram account I purchased from Topnotchlogs had real, active followers. My engagement skyrocketed within a week!"
            name="Sarah Johnson"
            role="Digital Marketer"
          />

          <TestimonialCard
            rating={5}
            text="As an agency, we regularly purchase accounts from Topnotchlogs. Their verification process is unmatched in the industry."
            name="Michael Chen"
            role="Marketing Agency Owner"
          />

          <TestimonialCard
            rating={4}
            text="Quick delivery and excellent support. The TikTok account I bought already had a loyal following that aligned with my niche."
            name="Jessica Williams"
            role="Content Creator"
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
