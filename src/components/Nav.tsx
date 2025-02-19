'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentProps, ReactNode, useState } from 'react';
import { BiShoppingBag } from 'react-icons/bi';
import { FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';
import React from 'react';
import useCart from '@/lib/hooks/useCart';
import { ShoppingBag } from 'lucide-react';

export function Nav({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const cart = useCart();

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#43286D] text-white shadow-xl z-50">
      <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-6 py-4 md:px-10 md:py-0">
        {/* Left side: Logo and Navigation Items */}
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Rendunks Logo"
              width={150}
              height={30}
            />
          </Link>
          <div className="hidden md:flex space-x-4">{children}</div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white text-3xl"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Mobile Navigation Items */}
        <div
          className={cn(
            'absolute md:hidden top-16 left-0 w-full bg-white text-black flex flex-col p-4 shadow-lg transition-all',
            { hidden: !isOpen, block: isOpen },
          )}
        >
          {React.Children.map(children, (child) => (
            <div className="w-full border-b border-gray-300 hover:bg-gray-200">
              <div className="w-full">{child}</div>
            </div>
          ))}
        </div>

        {/* Right side: Cart Icon */}
        <div className="md:flex items-center">
          <Link
            href="/cart"
            className="relative flex items-center gap-3 px-2 py-1"
          >
            <ShoppingBag className="w-6 h-6" />
            {cart.cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {cart.cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function NavLink(props: Omit<ComponentProps<typeof Link>, 'className'>) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      className={cn(
        'block md:uppercase font-myriad px-4 py-2 md:py-6 md:hover:bg-white md:hover:text-[#43286D] focus-visible:bg-secondary focus-visible:text-[#43286D]',
        pathname === props.href,
      )}
    />
  );
}
