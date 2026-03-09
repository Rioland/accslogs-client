import { Whatsapp } from "iconsax-reactjs";
import React from "react";
import Wrapper from "./Wrapper";

export default function TopBar() {
  return (
    <div className="bg-[#194572] text-white h-16 w-full pt-4">
      <Wrapper>
        <div className="flex flex-row justify-start items-center ml-3 gap-2 md:gap-3">
          <p className="text-sm md:text-base">Topnotchlogs - Accounts store</p>
          <Whatsapp size="32" color="#F87D1F" variant="Bold" />
          <a
            href="https://chat.whatsapp.com/ExDtiilSCUv6BL09xBaJQx"
            className="text-sm md:text-base text-[#F87D1F] hover:underline"
          >
            @Topnotchlogs1
          </a>
        </div>
      </Wrapper>
    </div>
  );
}
