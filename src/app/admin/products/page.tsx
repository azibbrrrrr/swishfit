import { Button } from '@/components/ui/button';
import { PageHeader } from '../_components/PageHeader';
import Link from 'next/link';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { db } from '@/lib/prisma';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { ActiveToggleButton, DeleteButton } from './_components/ProductActions';
import { Pencil } from 'lucide-react';

export default function AdminProductsPage() {
  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <PageHeader>Products</PageHeader>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>
      <ProductsTable />
    </>
  );
}

async function ProductsTable() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      priceInCents: true,
      isAvailableForPurchase: true,
      _count: { select: { OrderItem: true } },
    },
    orderBy: { name: 'asc' },
  });

  const quantityData = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  });

  const quantityMap = quantityData.reduce(
    (acc, item) => {
      acc[item.productId] = item._sum.quantity || 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (products.length === 0) {
    return <p className="text-gray-500 text-center py-6">No products found</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto bg-white shadow-lg dark:bg-gray-900 rounded-lg">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <TableRow className="border-b">
            <TableHead className="w-10 text-center">Status</TableHead>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Price</TableHead>
            <TableHead className="text-left">Orders</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <TableCell className="text-center">
                {product.isAvailableForPurchase ? (
                  <CheckCircle2 className="text-green-600 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-600 w-5 h-5" />
                )}
              </TableCell>
              <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                {product.name}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {formatCurrency(product.priceInCents / 100)}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {formatNumber(quantityMap[product.id] || 0)}
              </TableCell>
              <TableCell className="flex gap-2 justify-center py-3">
                <Button
                  asChild
                  variant="outline"
                  className="px-3 py-2 text-sm flex items-center gap-2"
                >
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Pencil size={16} />
                    Edit
                  </Link>
                </Button>
                <ActiveToggleButton
                  id={product.id}
                  isAvailableForPurchase={product.isAvailableForPurchase}
                />
                <DeleteButton
                  id={product.id}
                  disabled={quantityMap[product.id] > 0}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
