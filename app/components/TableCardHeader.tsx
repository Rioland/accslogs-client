/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Wrapper from './Wrapper';

// interface AccountProduct {
//   year: number | string;
//   description: string;
//   stock: number;
//   price: number;
//   isNoPhone?: boolean;
//   hasBackupEmail?: boolean;
//   isSmsVerified?: boolean;
//   genderMention?: 'Male or female' | string;
// }

interface TablCardHeaderProps {
  title?: string;
  products: any[];
  className?: string;
}

const TableCardHeader: React.FC<TablCardHeaderProps> = ({
  title = 'Gmail - Aged Accounts',
  products,
  className = '',
}) => {
  return (
    <div className={`w-full   ${className}`}>
     <Wrapper>
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_auto_1fr] bg-gray-900 text-white font-medium text-xs sm:text-sm md:text-base">
        <div className="px-4 py-4 sm:px-5">{title}</div>
        <div className="px-4 py-4 text-center sm:hidden">In Stock / Price</div>
        <div className="px-4 py-4 text-center hidden sm:block">In Stock</div>
        <div className="px-4 py-4 text-center hidden sm:block">Price</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100 bg-white">
        {products.map((product, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_auto_1fr] items-center px-4 py-4 sm:px-5 sm:py-5 hover:bg-gray-50 transition-colors"
          >
            {/* Product Info */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded bg-red-600 text-white font-bold text-xl flex items-center justify-center">
                M
              </div>

              <div className="space-y-1 text-xs sm:text-sm md:text-base">
                <div className="font-medium text-gray-900">
                  {product.name || `GMail Accounts | Registered in ${product.year}`}
                  {product.genderMention && (
                    <span className="text-gray-500 ml-1.5">• {product.genderMention}</span>
                  )}
                </div>

                {product.isNoPhone && (
                  <div className="text-gray-600 text-xs sm:text-sm">
                    No phone in security profile • 2FA included
                  </div>
                )}

                {product.isSmsVerified && (
                  <div className="text-gray-600 text-xs sm:text-sm">
                    SMS Verified • 2FA Enabled
                  </div>
                )}

                {(product.hasBackupEmail || product.description?.includes('Backup')) && (
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Backup email included
                  </div>
                )}

                {/* <div className="text-gray-500 text-xs sm:text-sm">
                  USA IP registration
                </div> */}
              </div>
            </div>

            {/* Stock */}
            <div className="text-center font-medium text-green-700 text-xs sm:text-sm md:text-base">
              {product.stock.toLocaleString()} pcs.
            </div>

            {/* Price & Button */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
              <div className="text-xs text-gray-500">from</div>
              <div className="text-base sm:text-lg md:text-xl font-semibold text-red-600">
                <del>N</del>{product.price.toFixed(2)}
              </div>
              <button
                className="
                  w-full sm:w-auto px-5 py-2 bg-amber-600 hover:bg-amber-700
                  text-white font-medium rounded-lg text-sm
                  transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                "
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
  
       </Wrapper>
     </div>
  );
};


export default TableCardHeader;
