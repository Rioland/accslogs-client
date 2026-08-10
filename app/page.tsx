"use client"

import TopBar from "./components/TopBar";
import Navbar1 from "./components/Navbar1";

import Footer from "./components/Footer";

import WarningModal from "./components/WarningModal";
import PremiumAccountsHero from "./components/PremiumAccountsHero";
import BillPaymentsSection from "./components/BillPaymentsSection";
import FeatureCard from "./components/FeatureCard";
import StepsSection from "./components/StepsSection";
import TestimonialsSection from "./components/TestimonialsSection";

export default function Home() {

  return (
    <div className="flex min-h-screen flex-col text-gray-900">
      <TopBar />
      <Navbar1 />
      <PremiumAccountsHero/>
      <BillPaymentsSection/>
      <FeatureCard/>
      <StepsSection/>
      <TestimonialsSection/>
      
      {/* <SocialMediaAcquisition /> */}
      <Footer />
      <WarningModal />
    </div>
  );
}
