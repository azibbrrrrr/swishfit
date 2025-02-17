'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/formatters';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { Product } from '@prisma/client';

const ProductDetails = ({ product }: { product: Product }) => {
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [colors, setColors] = useState<{ color: string; stock: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>(''); // Initially no option selected
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    // Pre-fill the option types based on the product options
    if (product) {
      // Handle the 'size' option type
      if (product.optionType === 'size') {
        const sizeOptions = product.options
          .filter((option) => option.value) // Assuming 'value' is the size name
          .map((option) => ({
            size: option.value, // Option value (size)
            stock: option.stock || 0, // Ensure stock is set to 0 if not available
          }));
        setSizes(sizeOptions);
      }

      // Handle the 'color' option type
      if (product.optionType === 'color') {
        const colorOptions = product.options
          .filter((option) => option.value) // Assuming 'value' is the color name
          .map((option) => ({
            color: option.value, // Option value (size)
            stock: option.stock || 0, // Ensure stock is set to 0 if not available
          }));
        setColors(colorOptions);
      }
    }
  }, [product]);

  return (
    <div className="bg-[#2E1D4F] px-40 py-6 w-full min-h-screen">
      {/* Make the background take full screen height */}
      <div className="max-w-screen-xl mx-auto w-full flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="aspect-video flex-shrink-0 w-full md:w-1/3 relative mb-6 md:mb-0 flex items-start justify-start">
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
          {sizes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-myriad font-bold">Select Size</h3>
              <div className="flex gap-2 mt-4 flex-wrap">
                {sizes.map((option) => (
                  <label
                    key={option.size}
                    className={`flex items-center gap-2 text-white mb-2 ${
                      option.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={option.size}
                      checked={selectedOption === option.size}
                      onChange={() =>
                        option.stock > 0 && setSelectedOption(option.size)
                      }
                      className="hidden"
                      disabled={option.stock === 0}
                    />
                    <span
                      className={`px-6 py-2 rounded-none font-myriad cursor-pointer ${
                        selectedOption === option.size
                          ? 'bg-white text-black'
                          : 'bg-transparent text-white border border-white'
                      } hover:bg-white hover:text-black ${
                        option.stock === 0 ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {option.size}
                    </span>
                  </label>
                ))}
              </div>
              {selectedOption && (
                <h3 className="text-xl font-bold text-white">
                  {sizes.find((option) => option.size === selectedOption)
                    ?.stock || 0}{' '}
                  in stock
                </h3>
              )}
            </div>
          )}

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-myriad font-bold">Select Color</h3>
              <div className="flex gap-2 mt-4 flex-wrap">
                {colors.map((option) => (
                  <label
                    key={option.color}
                    className={`flex items-center gap-2 text-white mb-2 ${
                      option.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={option.color}
                      checked={selectedOption === option.color}
                      onChange={() =>
                        option.stock > 0 && setSelectedOption(option.color)
                      }
                      className="hidden"
                      disabled={option.stock === 0}
                    />
                    <span
                      className={`px-6 py-2 rounded-none font-myriad cursor-pointer ${
                        selectedOption === option.color
                          ? 'bg-white text-black'
                          : 'bg-transparent text-white border border-white'
                      } hover:bg-white hover:text-black ${
                        option.stock === 0 ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {option.color}
                    </span>
                  </label>
                ))}
              </div>
              {selectedOption && (
                <h3 className="text-xl font-bold text-white">
                  {colors.find((option) => option.color === selectedOption)
                    ?.stock || 0}{' '}
                  in stock
                </h3>
              )}
            </div>
          )}

          {/* Quantity Selection */}
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-white font-bold text-base-medium">Quantity:</p>
            <div className="mt-2 flex gap-4 items-center">
              <MinusCircle
                className="hover:text-red-1 cursor-pointer text-white"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
              />
              <p className="text-body-bold text-white text-xl">{quantity}</p>
              <PlusCircle
                className="hover:text-red-1 cursor-pointer text-white"
                onClick={() => setQuantity(quantity + 1)}
              />
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
