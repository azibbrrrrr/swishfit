import { db } from '@/lib/prisma';
import { PageHeader } from '../../../_components/PageHeader';
import { ProductForm } from '../../_components/ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      sizes: true, // This will fetch the related options
      colors: true, // This will fetch the related options
    },
  });

  return (
    <>
      <PageHeader>Edit Product</PageHeader>
      <ProductForm product={product} />
    </>
  );
}
