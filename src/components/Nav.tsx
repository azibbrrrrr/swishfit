'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentProps, ReactNode } from 'react';
import { BiShoppingBag } from 'react-icons/bi';
import Image from 'next/image';

export function Nav({ children }: { children: ReactNode }) {
  return (
    <nav className="bg-[#43286D] text-white flex justify-between items-center shadow-xl px-10 w-full">
      <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center">
        {/* Left side: Logo */}
        <div className="flex items-center space-x-8">
          <Image src="/logo.svg" alt="Rendunks Logo" width={150} height={30} />
          {/* Center: Navigation Items */}
          <div className="flex space-x-2">{children}</div>
        </div>

        {/* Right side: Cart Icon */}
        <div className="flex items-center">
          <BiShoppingBag className="text-white text-3xl" />
          {/* You can adjust the size and color here */}
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
        'uppercase font-myriad px-4 py-6 hover:bg-white hover:text-[#43286D] focus-visible:bg-secondary focus-visible:text-[#43286D]',
        pathname === props.href,
      )}
    />
  );
}
