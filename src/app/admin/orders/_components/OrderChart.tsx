'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Order {
  id: string;
  createdAt: Date;
  totalPriceInCents: number;
  user: { email: string };
  orderItems: {
    product: { id: string; name: string };
    quantity: number;
  }[];
}

export default function OrderChart({ orders }: { orders: Order[] }) {
  // Convert `createdAt` to a readable format
  const data = orders.map((order) => ({
    date: new Date(order.createdAt).toLocaleDateString(), // Format date
    total: order.totalPriceInCents / 100, // Convert cents to dollars
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
