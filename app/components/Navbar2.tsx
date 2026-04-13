/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import Wrapper from "./Wrapper";
import supabaseClient from "@/lib/supabaseClient";

import { ArrowDown2, HamburgerMenu, SearchNormal } from "iconsax-reactjs";

interface Subcategory {
  id: number;
  name: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  created_at: string;
  subcategories: Subcategory[];
}

interface Props {
  onSelectCategory?: (category: Category, subcategory?: Subcategory) => void;
}

export default function Navbar2({ onSelectCategory }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats, error: catError } = await supabaseClient
        .from("socialmedia_account_category")
        .select("*");
      const { data: subs, error: subError } = await supabaseClient
        .from("socialmedia_account_subcategory")
        .select("*");

      if (catError || subError) {
        console.error(
          "Error fetching categories or subcategories:",
          catError,
          subError,
        );
        return;
      }

      if (cats && subs) {
        const categoriesWithSubs = cats.map((cat) => ({
          ...cat,
          subcategories: subs.filter((sub) => sub.category_id === cat.id),
        }));
        setCategories(categoriesWithSubs);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="w-full bg-white shadow-sm ">
      <Wrapper>
        <div className="flex flex-col md:flex-row justify-between items-center py-3 gap-4 md:gap-4">
          <img
            src="/images/logo.png"
            alt="logo"
            className="object-contain w-48 h-48 md:w-38 md:h-38 "
          />
          <div className="relative w-full md:w-max-content ">
            <div
              className="flex cursor-pointer flex-row items-center justify-between gap-2 rounded-md bg-[#F87D1F] p-2 text-white hover:bg-[#e06b10]"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex flex-row gap-2 items-center">
                <HamburgerMenu size="32" color="#ffffff" variant="Outline" />
                <p className="text-sm font-semibold text-white sm:text-base">
                  Select a Category
                </p>
              </div>
              <ArrowDown2
                size="32"
                color="#ffffff"
                variant="Bold"
                className={isOpen ? "transform rotate-180" : ""}
              />
            </div>
            {isOpen && (
              <div
                className="absolute top-full left-0 z-10 min-w-max rounded-md border border-gray-300 bg-white shadow-lg"
                onMouseLeave={() => setIsOpen(false)}
              >
                <div className="flex">
                  <ul className="py-2">
                    {categories.map((cat) => (
                      <li
                        key={cat.id}
                        className="cursor-pointer px-4 py-2 text-gray-900 hover:bg-gray-100"
                        onMouseEnter={() => setHoveredCategory(cat)}
                        onClick={() => {
                          onSelectCategory?.(cat);
                          setIsOpen(false);
                        }}
                      >
                        {cat.name}
                      </li>
                    ))}
                  </ul>
                  {hoveredCategory && (
                    <ul className="py-2 border-l border-gray-200">
                      {hoveredCategory.subcategories.map((sub) => (
                        <li
                          key={sub.id}
                          className="cursor-pointer px-4 py-2 text-gray-900 hover:bg-gray-100"
                          onClick={() => {
                            onSelectCategory?.(hoveredCategory, sub);
                            setIsOpen(false);
                          }}
                        >
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Search bar */}

          <div className="flex w-full items-center rounded-md border border-gray-300 bg-white px-4 py-2 md:ml-6 md:w-max-content">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full px-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none sm:text-base"
            />

            <SearchNormal size="28" color="#4b5563" variant="Outline" />
          </div>
        </div>
      </Wrapper>
    </div>
  );
}
