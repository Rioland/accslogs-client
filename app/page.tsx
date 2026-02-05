"use client"

import TopBar from "./components/TopBar";
import Navbar1 from "./components/Navbar1";
import Navbar2 from "./components/Navbar2";
import TableCardHeader from "./components/TableCardHeader";
import Footer from "./components/Footer";
import SocialMediaAcquisition from "./components/SocialMediaAcquisition";

export default function Home() {
  const categories = [
    { name: "Electronics", subcategories: ["Phones", "Laptops"] },
    { name: "Clothing", subcategories: ["Shirts", "Pants"] },
  ];

  const handleSelectCategory = (category: string, subcategory: string) => {
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
      <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />
      <TableCardHeader products={products} className="mt-6" />
      <TableCardHeader products={products} className="mt-6" />
      <TableCardHeader products={products} className="mt-6" />
      <TableCardHeader products={products} className="mt-6" />


      <SocialMediaAcquisition />
      <Footer />

    </div>
  );
}
