/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import TopBar from "./components/TopBar";
import Navbar1 from "./components/Navbar1";
import dynamic from "next/dynamic";

import Footer from "./components/Footer";
import SocialMediaAcquisition from "./components/SocialMediaAcquisition";
import WarningModal from "./components/WarningModal";
import PremiumAccountsHero from "./components/PremiumAccountsHero";
import FeatureCard from "./components/FeatureCard";
import StepsSection from "./components/StepsSection";
import TestimonialsSection from "./components/TestimonialsSection";

const Navbar2 = dynamic(() => import("./components/Navbar2"), { ssr: false });

export default function Home() {

  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  const products = [
    {
      year: 2015,
      description: "Old Gmail account with backup email",
      stock: 150,
      price: 5.99,
      isNoPhone: true,
      hasBackupEmail: true,
      isSmsVerified: false,
      genderMention: "Male"
    },
    {
      year: 2018,
      description: "Gmail account SMS verified",
      stock: 200,
      price: 7.50,
      isNoPhone: false,
      hasBackupEmail: false,
      isSmsVerified: true,
      genderMention: "Female"
    },
    {
      year: 2020,
      description: "Recent Gmail account",
      stock: 50,
      price: 10.00,
      isNoPhone: true,
      hasBackupEmail: true,
      isSmsVerified: false,
      genderMention: "Male or female"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />
      <PremiumAccountsHero/>
      <FeatureCard/>
      <StepsSection/>
      <TestimonialsSection/>
      
      {/* <SocialMediaAcquisition /> */}
      <Footer />
      <WarningModal />
    </div>
  );
}
