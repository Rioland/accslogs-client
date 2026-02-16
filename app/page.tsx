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
