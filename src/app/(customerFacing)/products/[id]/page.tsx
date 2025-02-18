import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetails from './purchase/_components/ProductForm';
import { Product } from '@prisma/client';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params; // Await params to resolve its value
  const product = await db.product.findUnique({
    where: { id },
    include: {
      sizes: true, // Include product options (size, color)
      colors: true, // Include product options (size, color)
    },
  });
  // Return 404 if the product is not found
  if (product == null) return notFound();

  // Return the ProductDetails component with the fetched product
  return <ProductDetails product={product} />;
}
