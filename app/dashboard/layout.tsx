"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabaseClient from '@/lib/supabaseClient'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
   
      if (!session) {
        router.push('/login')
      }
    }

    checkSession()
  }, [router])

  return <>{children}</>
}
