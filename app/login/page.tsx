/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import Navbar1 from '../components/Navbar1'

import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import LoginForm from './LoginForm'
import Navbar2 from '../components/Navbar2'

// const Navbar2 = dynamic(() => import('../components/Navbar2'), { ssr: false })

export default function LoginPage() {
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      <div className='flex-1'>
        <LoginForm />
      </div>
      <Footer />
    </div>
  )
}
