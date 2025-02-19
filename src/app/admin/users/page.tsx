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
import { db } from '@/lib/prisma';
import { DeleteDropDownItem } from './_components/UserActions';

async function getUsers() {
  return await db.user.findMany({
    select: {
      id: true,
      email: true,
      orders: { select: { totalPriceInCents: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader>Customers</PageHeader>
      <UsersTable />
    </div>
  );
}

async function UsersTable() {
  const users = await getUsers();

  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground">No customers found</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <Table className="w-full">
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-sm font-semibold">
              Email
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-sm font-semibold">
              Orders
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-sm font-semibold">
              Total Value
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-sm font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-b hover:bg-gray-50">
              <TableCell className="px-6 py-4 text-sm">{user.email}</TableCell>
              <TableCell className="px-6 py-4 text-sm">
                {formatNumber(user.orders.length)}
              </TableCell>
              <TableCell className="px-6 py-4 text-sm font-medium text-green-600">
                {formatCurrency(
                  user.orders.reduce((sum, o) => o.totalPriceInCents + sum, 0) /
                    100,
                )}
              </TableCell>
              <TableCell className="px-6 py-4 text-sm">
                <DeleteDropDownItem id={user.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
