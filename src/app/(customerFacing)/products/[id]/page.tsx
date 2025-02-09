import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetails from './purchase/_components/ProductForm';

export default async function ProductPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const product = await db.product.findUnique({ where: { id } });
  if (product == null) return notFound();

  return <ProductDetails product={product} />;
}
