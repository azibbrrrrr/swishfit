import { Nav, NavLink } from '@/components/Nav';

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
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
