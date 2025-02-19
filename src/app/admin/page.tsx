import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/lib/prisma';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  LineChart,
  AlertCircle,
} from 'lucide-react';

async function getSalesData() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: last30Days } },
    select: { totalPriceInCents: true },
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalPriceInCents,
    0,
  );
  const avgOrderValue = orders.length === 0 ? 0 : totalRevenue / orders.length;

  return {
    totalRevenue: totalRevenue / 100,
    avgOrderValue: avgOrderValue / 100,
    orderCount: orders.length,
  };
}

async function getCustomerData() {
  const totalUsers = await db.user.count();
  const newUsersLast30Days = await db.user.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
  });

  return { totalUsers, newUsersLast30Days };
}

async function getProductInsights() {
  const bestSellingProducts = await db.orderItem.groupBy({
    by: ['productId', 'productName'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 3,
  });

  const lowStockProducts = await db.productVariation.findMany({
    where: { stock: { lte: 5 } },
    select: {
      productId: true,
      product: { select: { name: true } },
      stock: true,
    },
  });

  return { bestSellingProducts, lowStockProducts };
}

export default async function AdminDashboard() {
  const [salesData, customerData, productInsights] = await Promise.all([
    getSalesData(),
    getCustomerData(),
    getProductInsights(),
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <DashboardCard
        title="Revenue (Last 30 Days)"
        subtitle={`Avg Order Value: ${formatCurrency(salesData.avgOrderValue)}`}
        body={formatCurrency(salesData.totalRevenue)}
        icon={<TrendingUp className="w-8 h-8 text-green-500" />}
      />
      <DashboardCard
        title="New Customers"
        subtitle="Last 30 Days"
        body={formatNumber(customerData.newUsersLast30Days)}
        icon={<Users className="w-8 h-8 text-blue-500" />}
      />
      <DashboardCard
        title="Best-Selling Product"
        subtitle={
          productInsights.bestSellingProducts.length > 0
            ? productInsights.bestSellingProducts[0].productName
            : 'No sales yet'
        }
        body={`${formatNumber(productInsights.bestSellingProducts[0]?._sum?.quantity || 0)} sold`}
        icon={<ShoppingCart className="w-8 h-8 text-yellow-500" />}
      />
      <DashboardCard
        title="Low Stock Items"
        subtitle="Below 5 in stock"
        body={`${productInsights.lowStockProducts.length} Items`}
        icon={<AlertCircle className="w-8 h-8 text-red-500" />}
      />
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  subtitle: string;
  body: string;
  icon: React.ReactNode;
};

function DashboardCard({ title, subtitle, body, icon }: DashboardCardProps) {
  return (
    <Card className="p-4 shadow-lg rounded-xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="text-gray-500">
            {subtitle}
          </CardDescription>
        </div>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{body}</p>
      </CardContent>
    </Card>
  );
}
