import { Whatsapp } from "iconsax-reactjs";
import React from "react";
import Wrapper from "./Wrapper";

export default function TopBar() {
  return (
    <div className="w-full bg-[#194572] py-3 text-white">
      <Wrapper>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs sm:text-sm md:text-base">
          <p className="font-semibold text-white">
            Topnotchlogs — Accounts store
          </p>
          <span className="inline-flex shrink-0">
            <Whatsapp size="28" color="#F87D1F" variant="Bold" />
          </span>
          <a
            href="https://chat.whatsapp.com/ExDtiilSCUv6BL09xBaJQx"
            className="font-semibold text-amber-300 underline-offset-2 hover:text-amber-200 hover:underline"
          >
            @Topnotchlogs1
          </a>
        </div>
      </Wrapper>
    </div>
  );
}
