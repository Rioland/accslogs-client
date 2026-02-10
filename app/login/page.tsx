/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useMemo, useState } from 'react'
import Navbar1 from '../components/Navbar1'
import Navbar2 from '../components/Navbar2'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import { useRouter } from 'next/navigation'
import supabaseClient from '@/lib/supabaseClient'

function isValidEmail(email: string) {
  return /^(?:[a-zA-Z0-9_'^&+%?`{|}~-]+(?:\.[a-zA-Z0-9_'^&+%?`{|}~-]+)*|\"(?:[^\"]|\\\")+\")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(email)
}

export default function LoginPage() {
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory)
  }

  const router = useRouter()
  const supabase = useMemo(() => supabaseClient, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Input validation
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Successful login -> redirect
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      <div className='flex-1'>
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
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className={`
                w-full py-3 px-6 font-medium text-white rounded-lg
                transition-all duration-200 shadow-md
                ${isSubmitting || !email || !password
                  ? 'bg-amber-400 cursor-not-allowed' 
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'}
              `}
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
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
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
