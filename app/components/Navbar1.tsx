"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from './Wrapper'
import { ArrowDown2, HamburgerMenu, InfoCircle, ProfileCircle } from 'iconsax-reactjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import supabase from '@/lib/supabaseClient'

export default function Navbar1() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;
        const check = async () => {
            const { data } = await supabase.auth.getSession();
            if (!mounted) return;
            setIsAuthed(!!data.session);
        };
        check();
        const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
            setIsAuthed(!!session);
        });
        return () => {
            mounted = false;
            listener?.subscription?.unsubscribe?.();
        };
    }, []);

    return (
        <div className='bg-white w-full py-2 shadow-sm'>
            <Wrapper >
                <div className='flex flex-row justify-between items-center'>

                    <Link href="" className=' rounded-4xl border border-blue-400 p-2 flex flex-row items-center gap-2 hover:bg-gray-200 cursor-pointer'>
                        <InfoCircle size="28" color="#FF8A65" variant="Bold" />
                        <p className='text-blue-400 hidden md:block text-base'>Ask a question</p>
                    </Link>

                    <div className='hidden md:flex flex-row gap-3.5'>
                        <Link href="/" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/' ? 'text-[#FF8A65]' : ''}`}>Home</Link>
                        <Link href="/market-place" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/market-place' ? 'text-[#FF8A65]' : ''}`}>Market Place</Link>
                        <Link href="/about" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/about' ? 'text-[#FF8A65]' : ''}`}>About</Link>
                        <Link href="/contact" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/contact' ? 'text-[#FF8A65]' : ''}`}>Contact</Link>
                        <Link href="/faq" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/faq' ? 'text-[#FF8A65]' : ''}`}>FAQ</Link>
                    </div>

                    <div className='flex flex-row items-center gap-2'>
                        <button className='md:hidden cursor-pointer' onClick={() => setIsOpen(!isOpen)}>
                            <HamburgerMenu size="32" color="#FF8A65" />
                        </button>

                         {isAuthed ? (
                          <Link href="/dashboard" className='hidden text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg md:flex flex-row gap-2.5 items-center  justify-between border border-[#FF8A65] rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                              <div className='flex flex-row items-center gap-2.5'>
                                  <ProfileCircle size="32" color="#FF8A65" variant="Bold" />
                                  <p className='text-[#FF8A65]'>Dashboard</p>
                              </div>
                          </Link>
                        ) : (
                          <>
                            <Link href="/login" className='hidden md:flex text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg border border-gray-300 rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                              Login
                            </Link>
                            <Link href="/signup" className='hidden md:flex text-white bg-amber-600 hover:bg-amber-700 mx-2 font-bold text-lg rounded-4xl p-2 cursor-pointer'>
                              Sign Up
                            </Link>
                          </>
                        )}




                    </div>


                </div>
                {isOpen && (
                    <div className='md:hidden flex flex-col gap-2 mt-4'>
                        <Link href="/" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/' ? 'text-blue-500' : ''}`}>Home</Link>
                        <Link href="/market-place" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/market-place' ? 'text-[#FF8A65]' : ''}`}>Market Place</Link>
                        <Link href="/about" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/about' ? 'text-blue-500' : ''}`}>About</Link>
                        <Link href="/contact" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/contact' ? 'text-blue-500' : ''}`}>Contact</Link>
                        <Link href="/faq" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/faq' ? 'text-blue-500' : ''}`}>FAQ</Link>
                        {/* dashboard / auth items */}
                        {isAuthed ? (
                          <Link href="/dashboard" className='text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg flex flex-row gap-2.5 items-center  justify-between border border-[#FF8A65] rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                              <div className='flex flex-row items-center gap-2.5'>
                                  <ProfileCircle size="32" color="#FF8A65" variant="Bold" />
                                  <p className='text-[#FF8A65]'>Dashboard</p>
                              </div>
                              <ArrowDown2 size="32" color="#FF8A65" variant="Bold" />
                          </Link>
                        ) : (
                          <div className='flex flex-col gap-2'>
                            <Link href="/login" className='text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg border border-gray-300 rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                              Login
                            </Link>
                            <Link href="/signup" className='text-white bg-amber-600 hover:bg-amber-700 mx-2 font-bold text-lg rounded-4xl p-2 cursor-pointer text-center'>
                              Sign Up
                            </Link>
                          </div>
                        )}
                    </div>
                )}
            </Wrapper>
        </div>
    )
}
