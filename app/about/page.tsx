'use client'

import React from 'react'
import Navbar1 from '../components/Navbar1'
import Navbar2 from '../components/Navbar2'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import TopCard from '../components/About/TopCard'
import Wrapper from '../components/Wrapper'
import WhyChooseAccsZone from '../components/About/WhyChooseAccsLogs'

export default function AboutPage() {
          const categories = [
    { name: "Electronics", subcategories: ["Phones", "Laptops"] },
    { name: "Clothing", subcategories: ["Shirts", "Pants"] },
  ];

  const handleSelectCategory = (category: string, subcategory: string) => {
    console.log("Selected:", category, subcategory);
  };

  return (
   <div className="flex flex-col min-h-screen bg-gray-400">
         <TopBar />
              <Navbar1 />
              <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />
       
                <TopCard />
                <WhyChooseAccsZone />
           


              <Footer />
        </div>
  )
}
