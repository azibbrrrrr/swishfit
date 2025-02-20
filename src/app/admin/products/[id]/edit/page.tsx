import { PageHeader } from '@/app/admin/_components/PageHeader';
import { db } from '@/lib/prisma';
import { ProductForm } from '../../_components/ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variations: true,
    },
  });

  return (
    <>
      <PageHeader>Edit Product</PageHeader>
      <ProductForm product={product} />
    </>
  );
}
