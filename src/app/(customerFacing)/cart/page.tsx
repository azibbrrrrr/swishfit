'use client';

import { formatCurrency } from '@/lib/formatters';
import useCart from '@/lib/hooks/useCart';
import { MinusCircle, PlusCircle, Trash } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { CheckoutModal } from './CheckoutModal';

const Cart = () => {
  const cart = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const total = cart.cartItems.reduce(
    (acc, cartItem) =>
      acc + (cartItem.item.priceInCents / 100) * cartItem.quantity,
    0,
  );
  const totalRounded = total.toFixed(2); // Ensures two decimal places

  return (
    <div className="flex gap-20 py-16 px-10 max-lg:flex-col max-sm:px-3">
      <div className="w-2/3 max-lg:w-full">
        <p className="text-heading3-bold">Shopping Cart</p>
        <hr className="my-6" />

        {cart.cartItems.length === 0 ? (
          <p className="text-body-bold">No item in cart</p>
        ) : (
          <div>
            {cart.cartItems.map((cartItem) => (
              <div
                key={`${cartItem.item.id}-${cartItem.color || ''}-${cartItem.size || ''}`}
                className="w-full flex max-sm:flex-col max-sm:gap-3 hover:bg-grey-1 px-4 py-3 items-center max-sm:items-start justify-between"
              >
                <div className="flex items-center">
                  <Image
                    src={cartItem.item.imagePath}
                    width={100}
                    height={100}
                    className="rounded-lg w-32 h-32 object-cover"
                    alt="product"
                  />
                  <div className="flex flex-col gap-3 ml-4">
                    <p className="text-body-bold">{cartItem.item.name}</p>
                    {cartItem.color && (
                      <p className="text-small-medium">{cartItem.color}</p>
                    )}
                    {cartItem.size && (
                      <p className="text-small-medium">{cartItem.size}</p>
                    )}
                    <p className="text-small-medium">
                      {formatCurrency(cartItem.item.priceInCents / 100)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <MinusCircle
                    className="hover:text-red-1 cursor-pointer"
                    onClick={() => cart.decreaseQuantity(cartItem.item.id)}
                  />
                  <p className="text-body-bold">{cartItem.quantity}</p>
                  <PlusCircle
                    className="hover:text-red-1 cursor-pointer"
                    onClick={() => cart.increaseQuantity(cartItem.item.id)}
                  />
                </div>

                <Trash
                  className="hover:text-red-1 cursor-pointer"
                  onClick={() => cart.removeItem(cartItem.item.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-1/3 max-lg:w-full flex flex-col gap-8 bg-grey-1 rounded-lg px-4 py-5">
        <p className="text-heading4-bold pb-4">
          Summary{' '}
          <span>{`(${cart.cartItems.length} ${
            cart.cartItems.length > 1 ? 'items' : 'item'
          })`}</span>
        </p>
        <div className="flex justify-between text-body-semibold">
          <span>Total Amount</span>
          <span>RM {totalRounded}</span>
        </div>
        <button
          className={`border rounded-lg text-body-bold bg-white py-3 w-full   ${Number(totalRounded) === 0 ? 'cursor-not-allowed opacity-50' : 'hover:text-white hover:bg-black'}`}
          onClick={() => setIsModalOpen(true)}
        >
          Proceed to Checkout
        </button>
      </div>

      {isModalOpen && (
        <CheckoutModal
          cartItems={cart.cartItems}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Cart;
