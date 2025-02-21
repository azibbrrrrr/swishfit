'use client';

import useCart from '@/lib/hooks/useCart';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SuccessfulPayment = () => {
  const cart = useCart();
  const [hasCleared, setHasCleared] = useState(false);

  useEffect(() => {
    if (cart?.clearCart && !hasCleared) {
      cart.clearCart();
      setHasCleared(true); // Prevent re-triggering
    }
  }, [cart, hasCleared]);

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-5">
      <p className="text-heading4-bold text-red-1">Successful Payment</p>
      <p>Thank you for your purchase</p>
      <Link
        href="/"
        className="p-4 border text-base-bold hover:bg-black hover:text-white"
      >
        CONTINUE TO SHOPPING
      </Link>
    </div>
  );
};

export default SuccessfulPayment;
