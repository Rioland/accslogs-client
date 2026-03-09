/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabaseClient from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

function isValidEmail(email: string) {
  return /^(?:[a-zA-Z0-9_'^&+%?`{|}~-]+(?:\.[a-zA-Z0-9_'^&+%?`{|}~-]+)*|\"(?:[^\"]|\\\")+\")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(email)
}

export default function LoginForm() {
  const router = useRouter()
  const supabase = useMemo(() => supabaseClient, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Input validation
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      toast.error('Please fill in all fields.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        toast.error(signInError.message)
        return
      }

      // Get the session to confirm sign-in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        toast.error('Unable to retrieve session.')
        return
      }

      // Get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Unable to retrieve user information.')
        return
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)

      if (adminError) {
        toast.error('Unable to retrieve user information.')
        return
      }

      if (adminData && adminData.length > 0) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
        window.location.href = adminUrl;
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full md:w-6/12 mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mt-12">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 bg-linear-to-b from-white to-gray-50 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          <span className="text-gray-900">Topn</span>
          <span className="text-amber-600">otch</span>
          <span className="text-gray-900">logs</span>
        </h1>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">Login</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
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
            ${
              isSubmitting || !email || !password
                ? "bg-amber-400 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
            }
          `}
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>

        {/* Links */}
        <div className="text-center space-y-3 text-sm">
          <a
            href="/forgot-password"
            className="text-amber-700 hover:text-amber-800 hover:underline"
          >
            Forgot Password?
          </a>

          <div className="text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-amber-700 hover:text-amber-800 font-medium hover:underline"
            >
              Sign Up
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
