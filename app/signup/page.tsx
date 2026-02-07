// app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Footer from '../components/Footer';
import Navbar1 from '../components/Navbar1';
import Navbar2 from '../components/Navbar2';
import TopBar from '../components/TopBar';

export default function SignUpPage() {
        const [formData, setFormData] = useState({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                referralCode: '',
        });

        const [error, setError] = useState<string | null>(null);
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const { name, value } = e.target;
                setFormData((prev) => ({ ...prev, [name]: value }));
                setError(null);
        };

        const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();

                // Basic validation
                if (!formData.email || !formData.password || !formData.firstName) {
                        setError('Please fill in all required fields');
                        return;
                }

                if (formData.password !== formData.confirmPassword) {
                        setError('Passwords do not match');
                        return;
                }

                if (formData.password.length < 8) {
                        setError('Password must be at least 8 characters long');
                        return;
                }

                setIsSubmitting(true);
                setError(null);

                // Here you would normally call your API (e.g. fetch('/api/register', ...))
                try {
                        console.log('Sign up data:', formData);

                        // Simulate API call
                        await new Promise((resolve) => setTimeout(resolve, 1200));

                        // On success → redirect or show success message
                        alert('Account created successfully! (demo)');
                        // router.push('/dashboard') or similar
                } catch (err) {
                        setError('Something went wrong. Please try again.');
                } finally {
                        setIsSubmitting(false);
                }
        };
        const categories = [
                { name: "Electronics", subcategories: ["Phones", "Laptops"] },
                { name: "Clothing", subcategories: ["Shirts", "Pants"] },
        ];

        const handleSelectCategory = (category: string, subcategory: string) => {
                console.log("Selected:", category, subcategory);
        };
        return (
                <div className="min-h-screen  bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                        <TopBar />
                        <Navbar1 />
                        <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />

                        <div className='flex-1'>
                                <div className="w-full md:w-6/12 md:mx-auto mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden my-16">
                                        {/* Header */}
                                        <div className="px-8 pt-10 pb-6 bg-linear-to-b from-white to-gray-50 text-center">
                                                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                                        <span className="text-gray-900">A</span>
                                                        <span className="text-amber-600">CCCS</span>
                                                        <span className="text-gray-900">ZONE</span>
                                                </h1>

                                                <h2 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900">
                                                        Create Account
                                                </h2>
                                                <p className="mt-2 text-sm md:text-base text-gray-600">
                                                        Join us today and get access to all features
                                                </p>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-10 space-y-6">
                                                {error && (
                                                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
                                                                {error}
                                                        </div>
                                                )}

                                                {/* Name fields - side by side on larger screens */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
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
                                                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                                                </div>

                                                {/* Confirm Password */}
                                                <div>
                                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                                                                Referral Code <span className="text-gray-500 text-xs">(Optional)</span>
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
                                                                You can leave this field empty if you don&apos;t have a referral code.
                                                        </p>
                                                </div>

                                                {/* Submit Button */}
                                                <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className={`
              w-full py-3.5 px-6 font-medium text-white rounded-lg
              transition-all duration-200 shadow-md
              ${isSubmitting
                                                                        ? 'bg-amber-400 cursor-not-allowed'
                                                                        : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'}
            `}
                                                >
                                                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                                </button>

                                                {/* Sign In link */}
                                                <div className="text-center text-sm text-gray-600 mt-4">
                                                        Already have an account?{' '}
                                                        <Link href="/login" className="text-amber-700 hover:text-amber-800 font-medium hover:underline">
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