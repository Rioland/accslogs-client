/* eslint-disable @typescript-eslint/no-explicit-any */
// app/signup/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Footer from '../components/Footer';
import Navbar1 from '../components/Navbar1';
import TopBar from '../components/TopBar';
import { useRouter } from 'next/navigation';
import supabaseClient from '@/lib/supabaseClient';

import toast from 'react-hot-toast';

function isValidEmail(email: string) {
  // RFC 5322-ish simple email regex
  return /^(?:[a-zA-Z0-9_'^&+%?`{|}~-]+(?:\.[a-zA-Z0-9_'^&+%?`{|}~-]+)*|"(?:[^"]|\\")+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
    email
  );
}

function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
  return null;
}

export default function SignUpPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseClient, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!isValidEmail(formData.email.trim())) {
      toast.error('Please enter a valid email');
      return;
    }
    const pwIssue = passwordIssues(formData.password);
    if (pwIssue) {
      toast.error(pwIssue);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) Sign up the user with Supabase Auth (email + password)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim() || null,
            referral_code: formData.referralCode.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      // 2) Insert a row into your public profiles (or users) table.
      // Update 'profiles' and column names to match your Supabase DB.
      const userId = signUpData.user?.id;
      if (userId) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: formData.email.trim(),
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim() || null,
            referral_code: formData.referralCode.trim() || null,
            created_at: new Date().toISOString(),
          });

        if (insertError && insertError.code !== '23505') {
          // 23505 = unique_violation (e.g., row already exists via trigger)
          toast.error(insertError.message);
          return;
        }
      }

      toast.success('Registration successful. Check your email for a welcome message.');

      // Fire-and-forget welcome email (SMTP from our API)
      void fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
        }),
      }).catch(() => {});

      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <TopBar />
      <Navbar1 />

      <div className="flex flex-1 flex-col px-4 pb-10 pt-8 sm:px-6 sm:pb-12">
        <div className="mx-auto my-8 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden sm:my-12">
          {/* Header */}
          <div className="bg-linear-to-b from-white to-gray-50 px-4 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              <span className="text-gray-900">Top</span>
              <span className="text-amber-600">notch</span>
              <span className="text-gray-900">logs</span>
            </h1>

            <h2 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
              Create Account
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Join us today and get access to all features
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-6 sm:px-8 pb-10 space-y-6"
          >
            {/* Name fields - side by side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Min 8 chars, include upper, lower, and number.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
              />
            </div>

            {/* Referral Code - Optional */}
            <div>
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Referral Code{" "}
                <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Enter referral code (if any)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can leave this field empty if you don&apos;t have a referral
                code.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
              w-full py-3.5 px-6 font-medium text-white rounded-lg
              transition-all duration-200 shadow-md
              ${isSubmitting ? "bg-amber-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"}
            `}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            {/* Sign In link */}
            <div className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-amber-700 hover:text-amber-800 font-medium hover:underline"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
