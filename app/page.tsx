"use client"
import Image from "next/image";
import TopBar from "./components/TopBar";
import Navbar1 from "./components/Navbar1";
import Navbar2 from "./components/Navbar2";

export default function Home() {
  const categories = [
    { name: "Electronics", subcategories: ["Phones", "Laptops"] },
    { name: "Clothing", subcategories: ["Shirts", "Pants"] },
  ];

  const handleSelectCategory = (category: string, subcategory: string) => {
    console.log("Selected:", category, subcategory);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar/>
      <Navbar1/>
      <Navbar2 categories={categories} onSelectCategory={handleSelectCategory} />

    </div>
  );
}
