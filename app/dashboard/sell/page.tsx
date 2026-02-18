/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import { Menu, X } from "lucide-react";
import Navbar1 from "../../components/Navbar1";
import dynamic from "next/dynamic";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import SellAccountForm from "../../components/SellAccountForm";

const Navbar2 = dynamic(() => import("../../components/Navbar2"), { ssr: false });

export default function SellPage() {
        const [activeKey, setActiveKey] = useState<string>("sell-account");
        const [mobileOpen, setMobileOpen] = useState(false);
        const router = useRouter();

        const handleChange = async (key: string) => {
                if (key === "sign-out") {
                        // await supabaseClient.auth.signOut();
                        router.push('/login');
                } else {
                        setActiveKey(key);
                }
        };

        const handleSelectCategory = (category: any, subcategory: any) => {
                console.log("Selected:", category, subcategory);
        };
        return (
                <div className="min-h-screen bg-[#e4e9ee] text-foreground">
                        <TopBar />
                        <Navbar1 />
                        <Navbar2 onSelectCategory={handleSelectCategory} />

                        {/* Top bar for mobile with menu toggle */}
                        <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
                                <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
                                        <button
                                                type="button"
                                                aria-label="Open menu"
                                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
                                                onClick={() => setMobileOpen(true)}
                                        >
                                                <Menu className="h-5 w-5" />
                                                Menu
                                        </button>
                                        <span className="text-base font-semibold text-gray-900">Sell Account</span>
                                </div>
                        </div>

                        <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
                                {/* Sidebar: desktop static */}
                                <div className="hidden md:block md:shrink-0">
                                        <Sidebar activeKey={activeKey} onChange={handleChange} />
                                </div>

                                {/* Sidebar: mobile off-canvas */}
                                {mobileOpen && (
                                        <div className="md:hidden">
                                                <div className="fixed inset-0 z-40 bg-black/40" aria-hidden onClick={() => setMobileOpen(false)} />
                                                <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
                                                        <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                                                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                                                        <span className="text-base font-semibold text-gray-900">Menu</span>
                                                                        <button
                                                                                type="button"
                                                                                aria-label="Close menu"
                                                                                className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                                                                                onClick={() => setMobileOpen(false)}
                                                                        >
                                                                                <X className="h-5 w-5" />
                                                                        </button>
                                                                </div>
                                                                <div className="p-2">
                                                                        <Sidebar activeKey={activeKey} onChange={(key) => { handleChange(key); setMobileOpen(false); }} />
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                )}

                                {/* Content column */}
                                <div className="flex-1 flex flex-col gap-4">
                                        <SellAccountForm />
                                </div>
                        </div>
                        <Footer />
                </div>
        );
}
