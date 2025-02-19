import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@prisma/client';

interface CartItem {
  item: Product;
  quantity: number;
  color?: string; // ? means optional
  size?: string; // ? means optional
}

interface CartStore {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (idToRemove: string) => void;
  increaseQuantity: (idToIncrease: string) => void;
  decreaseQuantity: (idToDecrease: string) => void;
  clearCart: () => void;
}

const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      cartItems: [],
      addItem: (data: CartItem) => {
        const { item, quantity, color, size } = data;
        const currentItems = get().cartItems; // all the items already in cart
        const isExisting = currentItems.find(
          (cartItem) => cartItem.item.id === item.id,
        );

        if (isExisting) {
          return toast('Item already in cart');
        }

        set({ cartItems: [...currentItems, { item, quantity, color, size }] });
        toast.success('Item added to cart', { icon: '🛒' });
      },
      removeItem: (idToRemove: String) => {
        const newCartItems = get().cartItems.filter(
          (cartItem) => cartItem.item.id !== idToRemove,
        );
        set({ cartItems: newCartItems });
        toast.success('Item removed from cart');
      },
      increaseQuantity: (idToIncrease: String) => {
        const newCartItems = get().cartItems.map((cartItem) =>
          cartItem.item.id === idToIncrease
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
        set({ cartItems: newCartItems });
        toast.success('Item quantity increased');
      },
      decreaseQuantity: (idToDecrease: string) => {
        const newCartItems = get().cartItems.map((cartItem) => {
          if (cartItem.item.id === idToDecrease) {
            const newQuantity = Math.max(1, cartItem.quantity - 1);

            if (cartItem.quantity > 1) {
              toast.success('Item quantity decreased');
            }

            return { ...cartItem, quantity: newQuantity };
          }
          return cartItem;
        });

        set({ cartItems: newCartItems });
      },

      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useCart;
