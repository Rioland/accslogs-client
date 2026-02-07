"use client"
import React, { useRef, useState } from 'react'
import Navbar1 from '../components/Navbar1'
import Navbar2 from '../components/Navbar2'
import TopBar from '../components/TopBar'
import Wrapper from '../components/Wrapper'
import Footer from '../components/Footer'


// const RECAPTCHA_SITE_KEY = process.env.VITE_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY_HERE';
export default function LoginPage() {
          const categories = [
    { name: "Electronics", subcategories: ["Phones", "Laptops"] },
    { name: "Clothing", subcategories: ["Shirts", "Pants"] },
  ];

  const handleSelectCategory = (category: string, subcategory: string) => {
    console.log("Selected:", category, subcategory);
  };
const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
//   const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Here you would call your login API
    console.log('Login attempt:', { email, password, recaptchaToken });

    // Reset form / show success / redirect...
    setError(null);
    // recaptchaRef.current?.reset(); // optional: reset captcha after submit
  };

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    setError(null);
  };

  return (
     <div className="flex flex-col min-h-screen">
       <TopBar />
       <Navbar1 />
       <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />

    <div className='flex-1' >
           <div className=" w-full md:w-6/12 mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mt-12">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 bg-linear-to-b from-white to-gray-50 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="text-gray-900">A</span>
            <span className="text-amber-600">CCCS</span>
            <span className="text-gray-900">Logis</span>
          </h1>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="
                w-full px-4 py-3 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                placeholder-gray-400 text-gray-900
              "
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="
                w-full px-4 py-3 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                placeholder-gray-400 text-gray-900
              "
            />
          </div>

          {/* reCAPTCHA */}
          {/* <div className="flex justify-center py-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={onRecaptchaChange}
              theme="light" // or "dark"
              size="normal"
            />
          </div> */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!recaptchaToken}
            className={`
              w-full py-3 px-6 font-medium text-white rounded-lg
              transition-all duration-200 shadow-md
              ${recaptchaToken 
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' 
                : 'bg-amber-400 cursor-not-allowed'}
            `}
          >
            Login
          </button>

          {/* Links */}
          <div className="text-center space-y-3 text-sm">
            <a href="/forgot-password" className="text-amber-700 hover:text-amber-800 hover:underline">
              Forgot Password?
            </a>

            <div className="text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-amber-700 hover:text-amber-800 font-medium hover:underline">
                Sign Up
              </a>
            </div>
          </div>

          {/* Small privacy note */}
          <div className="text-xs text-center text-gray-500 mt-4">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
              Terms of Service
            </a>{' '}
            apply.
          </div>
        </form>
      </div>
    </div>
    <Footer/>

    </div>
  )
}
