/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import Navbar1 from '../components/Navbar1'
import dynamic from 'next/dynamic'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import TopCard from '../components/About/TopCard'
import Wrapper from '../components/Wrapper'
import WhyChooseAccsZone from '../components/About/WhyChooseAccsLogs'

const Navbar2 = dynamic(() => import('../components/Navbar2'), { ssr: false })

export default function AboutPage() {
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  return (
   <div className="flex flex-col min-h-screen bg-gray-400">
         <TopBar />
              <Navbar1 />
              <Navbar2 onSelectCategory={handleSelectCategory} />
       
                <TopCard />
                <WhyChooseAccsZone />
           


              <Footer />
        </div>
  )
}
