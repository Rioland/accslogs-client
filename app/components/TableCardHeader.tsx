import React from 'react';

interface AccountProduct {
  year: number | string;
  description: string;
  stock: number;
  price: number;
  isNoPhone?: boolean;
  hasBackupEmail?: boolean;
  isSmsVerified?: boolean;
  genderMention?: 'Male or female' | string;
}

interface TablCardHeaderProps {
  title?: string;
  products: AccountProduct[];
  className?: string;
}

const TablCardHeader: React.FC<TablCardHeaderProps> = ({
  title = 'Gmail - Aged Accounts',
  products,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto border border-gray-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_auto_1fr] bg-gray-900 text-white font-medium text-sm md:text-base">
        <div className="px-5 py-4">{title}</div>
        <div className="px-4 py-4 text-center md:hidden">In Stock / Price</div>
        <div className="px-4 py-4 text-center hidden md:block">In Stock</div>
        <div className="px-4 py-4 text-center hidden md:block">Price</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100 bg-white">
        {products.map((product, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_auto_1fr] items-center px-5 py-5 hover:bg-gray-50 transition-colors"
          >
            {/* Product Info */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded bg-red-600 text-white font-bold text-xl flex items-center justify-center">
                M
              </div>

              <div className="space-y-1 text-sm md:text-base">
                <div className="font-medium text-gray-900">
                  {product.description || `GMail Accounts | Registered in ${product.year}`}
                  {product.genderMention && (
                    <span className="text-gray-500 ml-1.5">• {product.genderMention}</span>
                  )}
                </div>

                {product.isNoPhone && (
                  <div className="text-gray-600 text-xs md:text-sm">
                    No phone in security profile • 2FA included
                  </div>
                )}

                {product.isSmsVerified && (
                  <div className="text-gray-600 text-xs md:text-sm">
                    SMS Verified • 2FA Enabled
                  </div>
                )}

                {(product.hasBackupEmail || product.description?.includes('Backup')) && (
                  <div className="text-gray-600 text-xs md:text-sm">
                    Backup email included
                  </div>
                )}

                <div className="text-gray-500 text-xs md:text-sm">
                  USA IP registration
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="text-center font-medium text-green-700 text-sm md:text-base">
              {product.stock.toLocaleString()} pcs.
            </div>

            {/* Price & Button */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-xs text-gray-500">from</div>
              <div className="text-lg md:text-xl font-semibold text-red-600">
                ${product.price.toFixed(2)}
              </div>
              <button
                className="
                  px-5 py-2 bg-amber-600 hover:bg-amber-700 
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
    </div>
  );
};


export default TablCardHeader;