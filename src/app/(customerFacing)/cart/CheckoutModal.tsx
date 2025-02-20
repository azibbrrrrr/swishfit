'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CartItem {
  item: {
    id: string;
    name: string;
    priceInCents: number;
    imagePath: string;
  };
  size?: string;
  color?: string;
  quantity: number;
}

interface CheckoutModalProps {
  cartItems: CartItem[]; // ✅ Matches the type from useCart
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cartItems,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!email.trim()) {
      alert('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems, email }),
      });

      const data = await response.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl; // Redirect to Stripe Checkout
      } else {
        alert('Checkout failed.');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Please enter your email address</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          This will be used to send your order details and purchase
          confirmation. Ensure you enter a valid email to receive your order
          information.
        </DialogDescription>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
