"use client";

import React, { useState } from "react";
import Navbar1 from "../components/Navbar1";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";

/* ------------------------------------------------------------------ */
/*  Social link data                                                    */
/* ------------------------------------------------------------------ */

const socialLinks = [
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@topnotchlogs.com",
    description: "@topnotchlogs.com",
    color: "bg-black",
    hoverColor: "hover:bg-gray-900",
    textColor: "text-white",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/topnotchlogs?igsh=MTZ2bmpyb3QyaWc2Yw%3D%3D&utm_source=qr",
    description: "@topnotchlogs",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    hoverColor: "hover:opacity-90",
    textColor: "text-white",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "Email",
    href: "mailto:support@topnotchlogs.com",
    description: "support@topnotchlogs.com",
    color: "bg-[#F87D1F]",
    hoverColor: "hover:bg-[#e06b10]",
    textColor: "text-white",
    icon: <Mail className="h-7 w-7 text-white" />,
  },
  {
    name: "WhatsApp Community",
    href: "https://chat.whatsapp.com/ExDtiilSCUv6BL09xBaJQx",
    description: "Join our community",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    textColor: "text-white",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
];

const socialDelays = [0, 100, 200, 300] as const;
const infoDelays = [0, 200, 400] as const;

/* ------------------------------------------------------------------ */
/*  Contact Form                                                        */
/* ------------------------------------------------------------------ */

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    await new Promise((res) => setTimeout(res, 1200));

    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Message Sent!</h3>
        <p className="text-gray-500 max-w-sm">
          Thank you for reaching out. Our support team will get back to you
          within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm text-[#F87D1F] hover:underline font-medium"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87D1F] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87D1F] transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Subject
        </label>
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87D1F] bg-white transition"
        >
          <option value="">— Select a topic —</option>
          <option value="Account Issue">Account Issue</option>
          <option value="Payment Issue">Payment Issue</option>
          <option value="Order Issue">Order Issue</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Partnership">Partnership</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Describe your issue or question in detail…"
          rows={5}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87D1F] resize-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F87D1F] hover:bg-[#e06b10] disabled:opacity-60 text-white font-semibold px-6 py-3.5 text-sm transition-colors shadow-sm"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ContactPage() {

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <TopBar />
      <Navbar1 />

      {/* Hero */}
      <AnimatedSection
        animation="fade-down"
        threshold={0.1}
        className="bg-gradient-to-br from-[#194572] to-[#1e5490] py-14 px-4 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Contact Us
        </h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          Have a question or need support? We&apos;re here to help. Reach out
          through any of our channels below.
        </p>
      </AnimatedSection>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 space-y-12">
        {/* Social / Contact Channels */}
        <section>
          <AnimatedSection animation="fade-down" className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reach Us On</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialLinks.map((link, i) => (
              <AnimatedSection
                key={link.name}
                animation="fade-up"
                delay={socialDelays[i]}
              >
                <a
                  href={link.href}
                  target={link.href.startsWith("mailto") ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-3 rounded-2xl ${link.color} ${link.hoverColor} p-6 text-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    {link.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-base ${link.textColor}`}>
                      {link.name}
                    </p>
                    <p
                      className={`text-xs mt-0.5 opacity-85 ${link.textColor}`}
                    >
                      {link.description}
                    </p>
                  </div>
                </a>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* Divider */}
        <AnimatedSection
          animation="fade-up"
          className="flex items-center gap-4"
        >
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500 font-medium">
            Or send us a message
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </AnimatedSection>

        {/* Contact Form */}
        <AnimatedSection animation="fade-up" delay={100}>
          <section>
            <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] border border-gray-200 p-6 md:p-10 max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Send a Message
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill out the form below and we&apos;ll get back to you within
                  24 hours.
                </p>
              </div>
              <ContactForm />
            </div>
          </section>
        </AnimatedSection>

        {/* Quick info strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            {
              icon: "⏱️",
              title: "Response Time",
              desc: "We reply within 24 hours",
            },
            {
              icon: "🌍",
              title: "Available",
              desc: "Monday – Saturday, 9am – 6pm",
            },
            {
              icon: "🔒",
              title: "Secure",
              desc: "Your data is always protected",
            },
          ].map((item, i) => (
            <AnimatedSection
              key={item.title}
              animation="zoom-in"
              delay={infoDelays[i]}
            >
              <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-semibold text-gray-800 text-sm">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </section>
      </div>

      <Footer />
    </div>
  );
}
