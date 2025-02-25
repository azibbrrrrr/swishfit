'use client'; // This marks the component as a Client Component

import { formatCurrency } from '@/lib/formatters';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

type ProductCardProps = {
  id: string;
  name: string;
  priceInCents: number;
  description: string;
  imagePath: string;
};

export function ProductCard({
  id,
  name,
  priceInCents,
  imagePath,
}: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setLoading(true); // Show loading animation
    router.push(`/products/${id}`); // Navigate to the product page
  };

  return (
    <>
      {loading && (
        // Full-Screen Loading Overlay
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-12 h-12 border-[6px] border-gray-300 border-t-yellow-600 rounded-full animate-spin"></div>
        </div>
      )}

      <div
        onClick={handleClick}
        className="flex flex-col items-start w-full cursor-pointer"
      >
        <Image
          src={imagePath}
          alt={name}
          width={300}
          height={200}
          className="w-full max-w-[1000px]"
        />
        <p className="text-md mt-2">{name}</p>
        <p className="text-md font-semibold">
          {formatCurrency(priceInCents / 100)}
        </p>
      </div>
    </>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col items-start w-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full max-w-[1000px] h-[200px] bg-gray-300 rounded-md" />

      {/* Name Skeleton */}
      <div className="w-3/4 h-4 bg-gray-300 rounded-md mt-3"></div>

      {/* Price Skeleton */}
      <div className="w-1/2 h-4 bg-gray-300 rounded-md mt-2"></div>
    </div>
  );
}
