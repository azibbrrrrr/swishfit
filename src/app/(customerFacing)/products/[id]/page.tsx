import ProductDetails from '@/components/ProductDetails';
import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variations: true, // Include product variations
    },
  });
  // Return 404 if the product is not found
  if (product == null) return notFound();

  // Return the ProductDetails component with the fetched product
  return <ProductDetails product={product} />;
}
