'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/formatters';

interface Product {
  imagePath: string;
  name: string;
  priceInCents: number;
  description: string;
  optionType: string;
}

const ProductDetails = ({ product }: { product: Product }) => {
  const [selectedSize, setSelectedSize] = useState<string>(''); // Initially no size selected

  return (
    <div className="bg-[#2E1D4F] px-40 py-6 w-full min-h-screen">
      {/* Make the background take full screen height */}
      <div className="max-w-screen-xl mx-auto w-full flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="aspect-video flex-shrink-0 w-full md:w-1/3 relative mb-6 md:mb-0 flex items-start">
          <Image
            src={product.imagePath}
            fill
            alt={product.name}
            className="object-contain"
          />
        </div>

        {/* Product Details */}
        <div className="md:ml-6 w-full md:w-2/3">
          <h1 className="uppercase text-xl md:text-2xl font-myriad font-bold text-white">
            {product.name}
          </h1>
          <p className="text-xl md:text-2xl font-myriad font-bold text-white">
            {formatCurrency(product.priceInCents / 100)}
          </p>
          <p className="font-myriad mt-6 text-white">{product.description}</p>

          {/* Size Selection */}
          <div className="mt-6">
            <h3 className="text-white font-myriad font-bold">
              Select {product.optionType}
            </h3>
            <div className="flex gap-2 mt-4 flex-wrap">
              {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                <label
                  key={size}
                  className="flex items-center gap-2 text-white mb-2"
                >
                  <input
                    type="radio"
                    name="size"
                    value={size}
                    checked={selectedSize === size}
                    onChange={() => setSelectedSize(size)}
                    className="hidden"
                  />
                  <span
                    className={`px-6 py-2 rounded-none font-myriad cursor-pointer ${
                      selectedSize === size
                        ? 'bg-white text-black'
                        : 'bg-transparent text-white border border-white'
                    } hover:bg-white hover:text-black`}
                  >
                    {size}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Add to Bag Button */}
          <div className="mt-8">
            <button className="uppercase bg-yellow-400 text-black px-6 py-3 rounded-none font-myriad font-semibold text-xl w-full hover:bg-yellow-500">
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
