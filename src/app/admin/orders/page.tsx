import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { PageHeader } from '../_components/PageHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { DeleteDropDownItem } from './_components/OrderActions';
import { db } from '@/lib/prisma';
import OrderChart from './_components/OrderChart';

// Fetch orders & calculate sales insights
async function getOrdersWithInsights() {
  const orders = await db.order.findMany({
    select: {
      id: true,
      totalPriceInCents: true,
      user: { select: { email: true } },
      orderItems: {
        select: {
          product: { select: { name: true, id: true } },
          quantity: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate total sales revenue
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalPriceInCents,
    0,
  );

  // Calculate total orders
  const totalOrders = orders.length;

  // Calculate average order value (AOV)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Find best-selling products
  const productSalesCount: Record<string, { name: string; quantity: number }> =
    {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (!productSalesCount[item.product.id]) {
        productSalesCount[item.product.id] = {
          name: item.product.name,
          quantity: 0,
        };
      }
      productSalesCount[item.product.id].quantity += item.quantity;
    });
  });

  const bestSellingProducts = Object.values(productSalesCount)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  // Find top customers
  const customerSales: Record<string, { email: string; totalSpent: number }> =
    {};
  orders.forEach((order) => {
    if (!customerSales[order.user.email]) {
      customerSales[order.user.email] = {
        email: order.user.email,
        totalSpent: 0,
      };
    }
    customerSales[order.user.email].totalSpent += order.totalPriceInCents;
  });

  const topCustomers = Object.values(customerSales)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  return {
    orders,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    bestSellingProducts,
    topCustomers,
  };
}

export default async function OrdersPage() {
  const {
    orders,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    bestSellingProducts,
    topCustomers,
  } = await getOrdersWithInsights();

  return (
    <>
      <PageHeader>Sales Overview</PageHeader>

      {/* Sales Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalRevenue / 100)}
        />
        <StatCard title="Total Orders" value={formatNumber(totalOrders)} />
        <StatCard
          title="Avg. Order Value"
          value={formatCurrency(averageOrderValue / 100)}
        />
      </div>

      {/* Sales Graph */}
      <OrderChart orders={orders} />

      {/* Best Selling Products & Top Customers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard title="Best-Selling Products">
          {bestSellingProducts.length > 0 ? (
            bestSellingProducts.map((p) => (
              <p key={p.name}>
                {p.name} - {p.quantity} sold
              </p>
            ))
          ) : (
            <p>No data</p>
          )}
        </InfoCard>

        <InfoCard title="Top Customers">
          {topCustomers.length > 0 ? (
            topCustomers.map((c) => (
              <p key={c.email}>
                {c.email} - {formatCurrency(c.totalSpent / 100)}
              </p>
            ))
          ) : (
            <p>No data</p>
          )}
        </InfoCard>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} />
    </>
  );
}

// Orders Table Component
function OrdersTable({
  orders,
}: {
  orders: Awaited<ReturnType<typeof getOrdersWithInsights>>['orders'];
}) {
  if (orders.length === 0)
    return <p className="text-gray-500 text-center">No sales found</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-md">
      <Table className="w-full text-sm text-left bg-white">
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="py-3 px-4">Products</TableHead>
            <TableHead className="py-3 px-4">Customer</TableHead>
            <TableHead className="py-3 px-4">Price Paid</TableHead>
            <TableHead className="w-0 py-3 px-4 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow
              key={order.id}
              className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
            >
              <TableCell className="py-3 px-4">
                {order.orderItems.map((item) => item.product.name).join(', ')}
              </TableCell>
              <TableCell className="py-3 px-4">{order.user.email}</TableCell>
              <TableCell className="py-3 px-4 font-semibold text-gray-900">
                {formatCurrency(order.totalPriceInCents / 100)}
              </TableCell>
              <TableCell className="text-center py-3 px-4">
                <DeleteDropDownItem id={order.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg rounded-2xl text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-white shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
