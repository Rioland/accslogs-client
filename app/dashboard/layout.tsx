'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabaseClient'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'authed' | 'unauth'>('checking')

  useEffect(() => {
    let mounted = true

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) {
        setStatus('unauth')
        router.replace('/login')
      } else {
        setStatus('authed')
      }
    }

    check()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe?.()
    }
  }, [router])

  if (status !== 'authed') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Checking authentication...
      </div>
    )
  }

  return <>{children}</>
}
