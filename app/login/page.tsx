"use client"
import Navbar1 from '../components/Navbar1'

import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import LoginForm from './LoginForm'

export default function LoginPage() {

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />

      <div className="flex-1 px-4 pb-8 sm:px-6">
        <LoginForm />
      </div>
      <Footer />
    </div>
  )
}
