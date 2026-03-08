"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Navbar2 from "../components/Navbar2";
import Wrapper from "../components/Wrapper";
import Footer from "../components/Footer";
import TermsHeader from "../components/TermsHeader";
import TableOfContents from "../components/TableOfContents";

export default function Policy() {
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#e4e9ee]">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      <div className="flex-1 py-8">
        <Wrapper>
          <TermsHeader
            effectiveDate={"09/02/2023"}
            lastUpdated={"09/02/2023"}
          />
          <br />
          <TableOfContents />
          
        </Wrapper>
      </div>
      <Footer />
    </div>
  );
}
