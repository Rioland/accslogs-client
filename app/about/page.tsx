'use client'

import React from 'react'
import Navbar1 from '../components/Navbar1'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import TopCard from '../components/About/TopCard'
import WhyChooseAccsZone from '../components/About/WhyChooseAccsLogs'
import AboutBillPayments from '../components/About/BillPayments'
import AboutTextVerify from '../components/About/TextVerify'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-400">
      <TopBar />
      <Navbar1 />

      <TopCard />
      <AboutBillPayments />
      <AboutTextVerify />
      <WhyChooseAccsZone />

      <Footer />
    </div>
  )
}
