/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useMemo, useState, useEffect } from 'react'
import Navbar1 from '../components/Navbar1'
import Navbar2 from '../components/Navbar2'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import { useRouter } from 'next/navigation'
import supabaseClient from '@/lib/supabaseClient'

function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter'
  if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter'
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number'
  return null
}

export default function ResetPasswordPage() {
  const categories = [
    { name: "Electronics", subcategories: ["Phones", "Laptops"] },
    { name: "Clothing", subcategories: ["Shirts", "Pants"] },
  ]

  const handleSelectCategory = (category: string, subcategory: string) => {
    console.log("Selected:", category, subcategory)
  }

  const router = useRouter()
  const supabase = useMemo(() => supabaseClient, [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        setIsValidSession(false)
      } else {
        setIsValidSession(true)
      }
    }
    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Input validation
    const pwIssue = passwordIssues(password)
    if (pwIssue) {
      setError(pwIssue)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Success - redirect to login
      router.push('/login')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isValidSession === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <Navbar1 />
        <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />
        <div className='flex-1 flex items-center justify-center'>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <Navbar1 />
        <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />
        <div className='flex-1 flex items-center justify-center'>
          <div className="w-full md:w-6/12 mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
            <a href="/forgot-password" className="text-amber-700 hover:text-amber-800 hover:underline font-medium">
              Request New Reset Link
            </a>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />

      <div className='flex-1'>
        <div className=" w-full md:w-6/12 mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mt-12">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 bg-linear-to-b from-white to-gray-50 text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-gray-900">A</span>
              <span className="text-amber-600">CCCS</span>
              <span className="text-gray-900">Logis</span>
            </h1>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your new password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                  placeholder-gray-400 text-gray-900
                "
              />
              <p className="mt-1 text-xs text-gray-500">Min 8 chars, include upper, lower, and number.</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
              disabled={isSubmitting || !password || !confirmPassword}
              className={`
                w-full py-3 px-6 font-medium text-white rounded-lg
                transition-all duration-200 shadow-md
                ${isSubmitting || !password || !confirmPassword
                  ? 'bg-amber-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'}
              `}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
