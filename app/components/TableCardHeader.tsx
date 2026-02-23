import React from "react";
import Wrapper from "./Wrapper";
import { SellerProduct } from "@/types/callabelTypes";


interface TableCardHeaderProps {
  title?: string;
  products: SellerProduct[];
  className?: string;
}

const TableCardHeader: React.FC<TableCardHeaderProps> = ({
  title = "Products",
  products,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <Wrapper>
        {/* Header */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_1fr_1fr] bg-gray-900 text-white text-sm font-medium rounded-t-xl">
          <div className="px-5 py-4">{title}</div>
          <div className="px-5 py-4 text-center hidden sm:block">In Stock</div>
          <div className="px-5 py-4 text-center hidden sm:block">Price</div>
        </div>

        {/* Body */}
        <div className="bg-white divide-y divide-gray-200 rounded-b-xl shadow-sm">
          {products.map((product) => {
            const stock = product.seller_product_accounts?.[0]?.count ?? 0;

            const createdYear = new Date(product.created_at).getFullYear();

            return (
              <div
                key={product.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_1fr_1fr] items-center px-5 py-5 hover:bg-gray-50 transition"
              >
                {/* Product Info */}
                <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 px-4 bg-red-600 rounded-md flex items-center justify-center text-white font-bold">
                    {title.charAt(0).toUpperCase()}
                    </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900">
                      {product.name} • Created {createdYear}
                    </div>

                    <div className="text-sm text-gray-500 line-clamp-2">
                      {product.description}
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="text-center font-medium text-gray-800 mt-4 sm:mt-0">
                  {stock.toLocaleString()} pcs.
                </div>

                {/* Price */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 sm:mt-0">
                  <div className="text-sm text-gray-500">from</div>

                  <div className="text-lg font-semibold text-gray-900">
                    ₦{product.price.toLocaleString()}
                  </div>

                  <button className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition">
                    Buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Wrapper>
    </div>
  );
};

export default TableCardHeader;
