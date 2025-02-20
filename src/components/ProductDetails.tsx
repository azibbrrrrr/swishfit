'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/formatters';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { Product, ProductVariation } from '@prisma/client';
import useCart from '@/lib/hooks/useCart';

const ProductDetails = ({
  product,
}: {
  product: Product & { variations?: ProductVariation[] };
}) => {
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [colors, setColors] = useState<{ color: string; stock: number }[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const cart = useCart();

  useEffect(() => {
    if (product.variations) {
      const sizeSet = new Set<string>();
      const colorSet = new Set<string>();

      product.variations.forEach(({ size, color }) => {
        if (size) sizeSet.add(size);
        if (color) colorSet.add(color);
      });

      setSizes(Array.from(sizeSet).map((size) => ({ size, stock: 0 })));
      setColors(Array.from(colorSet).map((color) => ({ color, stock: 0 })));
    }
  }, [product.variations]);

  const getStockForSelection = () => {
    if (!product.variations) return 0;
    return (
      product.variations.find(
        (variation) =>
          (variation.size === selectedSize || !selectedSize) &&
          (variation.color === selectedColor || !selectedColor),
      )?.stock || 0
    );
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const filteredColors = product.variations
      .filter((v) => v.size === size && v.color)
      .map((v) => ({ color: v.color!, stock: v.stock }));
    setColors(filteredColors);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const filteredSizes = product.variations
      .filter((v) => v.color === color && v.size)
      .map((v) => ({ size: v.size!, stock: v.stock }));
    setSizes(filteredSizes);
  };

  // Define the correct size order
  const sizeOrder = ['S', 'M', 'L', 'XL', '2XL'];

  // Sort sizes based on the predefined order
  const sortedSizes = sizes.sort(
    (a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size),
  );

  return (
    <div className="bg-[#2E1D4F] px-6 md:px-20 py-6 w-full min-h-screen">
      <div className="max-w-screen-xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Image Section */}
        <div className="w-full flex justify-center items-start">
          <div className="relative aspect-square w-full md:w-2/3">
            <Image
              src={product.imagePath}
              fill
              alt={product.name}
              className="object-contain"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full">
          <h1 className="uppercase text-xl md:text-2xl font-myriad font-bold text-white">
            {product.name}
          </h1>
          <p className="text-xl md:text-2xl font-myriad font-bold text-white">
            {formatCurrency(product.priceInCents / 100)}
          </p>
          <p className="font-myriad mt-6 text-white">{product.description}</p>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-myriad font-bold">Select Color</h3>
              <div className="flex gap-2 mt-4 flex-wrap">
                {colors.map((option) => (
                  <button
                    key={option.color}
                    onClick={() => handleColorSelect(option.color)}
                    className={`px-6 py-2 border border-white font-myriad cursor-pointer ${
                      selectedColor === option.color
                        ? 'bg-white text-black'
                        : 'bg-transparent text-white'
                    } ${option.stock === 0 ? 'opacity-100' : ''}`}
                  >
                    {option.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-myriad font-bold">Select Size</h3>
              <div className="flex gap-2 mt-4 flex-wrap">
                {sortedSizes.map((option) => (
                  <button
                    key={option.size}
                    onClick={() => handleSizeSelect(option.size)}
                    className={`px-6 py-2 border font-myriad border-white cursor-pointer ${
                      selectedSize === option.size
                        ? 'bg-white text-black'
                        : 'bg-transparent text-white border '
                    } ${option.stock === 0 ? 'opacity-100' : ''}`}
                  >
                    {option.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedSize || sizes.length === 0) &&
            (selectedColor || colors.length === 0) && (
              <h3 className="text-xl font-bold text-white">
                {getStockForSelection()} in stock
              </h3>
            )}

          <div className="mt-6 flex items-center gap-4">
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

          <div className="mt-8">
            <button
              className={`uppercase bg-yellow-400 text-black px-6 py-3 font-myriad font-semibold text-xl w-full ${
                getStockForSelection() > 0 && (selectedSize || selectedColor)
                  ? 'hover:bg-yellow-500'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={getStockForSelection() === 0}
              onClick={() =>
                cart.addItem({
                  item: product,
                  quantity,
                  color: selectedColor,
                  size: selectedSize,
                })
              }
            >
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
