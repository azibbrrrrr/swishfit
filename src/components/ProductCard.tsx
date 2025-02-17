'use client'; // This marks the component as a Client Component

import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';
import Image from 'next/image';

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
  const handleScrollToTop = () => {
    // Scroll to the top of the page when the link is clicked
    window.scrollTo(0, 0);
  };

  return (
    <Link href={`/products/${id}`} scroll={false}>
      <div
        className="flex flex-col items-start w-full cursor-pointer"
        onClick={handleScrollToTop} // Add this to trigger scrolling to top on link click
      >
        <Image
          src={imagePath}
          alt={name}
          width={300}
          height={200}
          className="w-full max-w-[1000px]"
        />
        <p className="font-myriad text-lg mt-2">{name}</p>
        <p className="font-myriad text-lg font-bold">
          {formatCurrency(priceInCents / 100)}
        </p>
      </div>
    </Link>
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
