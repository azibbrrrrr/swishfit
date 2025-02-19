import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { cache } from '@/lib/cache';
import { db } from '@/lib/prisma';
import { Product } from '@prisma/client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import Image from 'next/image';

const getMostPopularProducts = cache(
  () => {
    return db.product.findMany({
      where: { isAvailableForPurchase: true },
      orderBy: { OrderItem: { _count: 'desc' } },
      take: 4,
    });
  },
  ['/', 'getMostPopularProducts'],
  { revalidate: 60 * 60 * 24 },
);

const getNewestProducts = cache(() => {
  return db.product.findMany({
    where: { isAvailableForPurchase: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
}, ['/', 'getNewestProducts']);

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-[#43286D] w-full">
        <header className=" text-white py-12 px-10 flex flex-col md:flex-row items-center justify-between max-w-screen-2xl mx-auto w-full">
          <div className=" flex-1 flex items-center justify-center mb-6 md:mb-0">
            <Image
              src="/jersey-mockup.svg"
              alt="Jersey Mockup"
              width={555}
              height={286}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="font-changa text-5xl md:text-6x ">
              UNLEASH THE DUNK. <br /> GEAR UP WITH RENDUNKS.
            </h1>
            <button className="bg-yellow-400 text-black px-6 py-2 mt-4 font-myriad font-bold text-2xl">
              SHOP NOW
            </button>
          </div>
        </header>
      </div>

      {/* Product Grid */}
      <ProductGridSection
        title="Most Popular"
        productsFetcher={getMostPopularProducts}
      />
      <ProductGridSection title="Newest" productsFetcher={getNewestProducts} />
    </div>
  );
}

type ProductGridSectionProps = {
  title: string;
  productsFetcher: () => Promise<Product[]>;
};

function ProductGridSection({
  productsFetcher,
  title,
}: ProductGridSectionProps) {
  return (
    <div className="space-y-4 px-8 py-6 max-w-[1350px] mx-auto">
      <div className="flex items-center gap-4">
        <h2 className="uppercase font-changa text-2xl">{title}</h2>
        <Button variant="outline" asChild>
          <Link href="/products" className="space-x-2 flex items-center">
            <span className="font-changa text-lg">View All</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      {/* Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProductSuspense({
  productsFetcher,
}: {
  productsFetcher: () => Promise<Product[]>;
}) {
  return (
    <>
      {(await productsFetcher()).map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </>
  );
}
