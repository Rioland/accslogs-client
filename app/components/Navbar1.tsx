"use client"
import React, { useState } from 'react'
import Wrapper from './Wrapper'
import { ArrowDown2, HamburgerMenu, InfoCircle, ProfileCircle } from 'iconsax-reactjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar1() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className='bg-white w-full py-5 shadow-sm'>
        <Wrapper >
                <div className='flex flex-row justify-between items-center'>

                    <Link  href="" className=' rounded-4xl border border-blue-400 p-2 flex flex-row items-center gap-2 hover:bg-gray-200 cursor-pointer'>
                        <InfoCircle size="32" color="#FF8A65" variant="Bold"/>
                        <p className='text-blue-400 hidden md:block'>Ask a question</p>
                    </Link>

                    <div className='hidden md:flex flex-row gap-3.5'>
                        <Link href="/" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/' ? 'text-[#FF8A65]' : ''}`}>Home</Link>
                        <Link href="/about" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/about' ? 'text-[#FF8A65]' : ''}`}>About</Link>
                        <Link href="/contact" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/contact' ? 'text-[#FF8A65]' : ''}`}>Contact</Link>
                    </div>

                    <div className='flex flex-row items-center gap-2'>
                        <button className='md:hidden cursor-pointer' onClick={() => setIsOpen(!isOpen)}>
                            <HamburgerMenu size="32" color="#FF8A65" />
                        </button>
                        {/* dashboard dropdown items */}
                        <Link href="" className='text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg flex flex-row gap-2.5 items-center  border border-[#FF8A65] rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                        <ProfileCircle size="32" color="#FF8A65" variant="Bold"/>
                        <p className='text-[#FF8A65]'>Dashboard</p>
                        <ArrowDown2 size="32" color="#FF8A65" variant="Bold"/>

                        </Link>



                    </div>


                </div>
                {isOpen && (
                    <div className='md:hidden flex flex-col gap-2 mt-4'>
                        <Link href="/" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/' ? 'text-blue-500' : ''}`}>Home</Link>
                        <Link href="/about" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/about' ? 'text-blue-500' : ''}`}>About</Link>
                        <Link href="/contact" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/contact' ? 'text-blue-500' : ''}`}>Contact</Link>
                    </div>
                )}
        </Wrapper>
    </div>
  )
}
