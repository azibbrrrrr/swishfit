import { Nav, NavLink } from '@/components/Nav';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Nav>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/orders">My Orders</NavLink>
      </Nav>

      {/* Main Content */}
      <main className="bg-white min-h-screen">{children}</main>
    </div>
  );
}
