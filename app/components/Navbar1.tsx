"use client"
import React from 'react'
import Wrapper from './Wrapper'
import { ArrowDown2, ProfileCircle } from 'iconsax-reactjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function Navbar1({ islogin, setLogin }: { islogin: boolean, setLogin: (islogin: boolean) => void }) {
  const pathname = usePathname();
  return (
    <div className='bg-white w-full py-2 shadow-sm'>
        <Wrapper >
                <div className='flex flex-row justify-between items-center'>
                    <div className='flex flex-row items-center'>
                        <Image src="/images/logo.png" alt="logo" width={50} height={50} />
                        <p className='text-2xl font-bold text-[#FF8A65]'>AccsLogs</p>
                    </div>
                    <div className='hidden md:flex flex-row gap-3.5'>
                        <Link href="/" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/' ? 'text-[#FF8A65]' : ''}`}>Home</Link>
                        <Link href="/about" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/about' ? 'text-[#FF8A65]' : ''}`}>About</Link>
                        <Link href="/contact" className={`text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg ${pathname === '/contact' ? 'text-[#FF8A65]' : ''}`}>Contact</Link>
                    </div>

                    <div className='flex flex-row items-center gap-2'>
                        {islogin ? <div className="flex flex-row items-center gap-2">
                            <Link href="/dashboard" className='text-gray-800 hover:text-gray-700 mx-2 font-bold text-lg flex flex-row gap-2.5 items-center  border border-[#FF8A65] rounded-4xl p-2 hover:bg-gray-200 cursor-pointer'>
                                <ProfileCircle size="32" color="#FF8A65" variant="Bold"/>
                                <p className='text-[#FF8A65]'>Dashboard</p>
                                <ArrowDown2 size="32" color="#FF8A65" variant="Bold"/>
                            </Link>
                            <button onClick={() => setLogin(false)} className='text-white bg-[#FF8A65] hover:bg-[#FF7043] focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center'>
                                Logout
                            </button>
                        </div>:
                        <div className='flex flex-row items-center gap-2'>
                            <button onClick={() => setLogin(true)} className='text-white bg-[#FF8A65] hover:bg-[#FF7043] focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center'>
                                Login
                            </button>
                            <button onClick={() => setLogin(true)} className='text-[#FF8A65] border border-[#FF8A65] hover:bg-orange-50 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center'>
                                Sign Up
                            </button>
                        </div>
                        }



                    </div>


                </div>
        </Wrapper>
    </div>
  )
}
