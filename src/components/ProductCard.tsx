import { formatCurrency } from '@/lib/formatters';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
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
  return (
    <Link href={`/products/${id}`}>
      <div className="flex flex-col items-start w-full cursor-pointer">
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
