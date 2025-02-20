'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MyOrdersPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Email sent! Please check your inbox.');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to send email. Please try again.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full mt-10">
      <Card className="shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check My Orders</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email and we will send your order history and download
            links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </Label>
            <Input
              type="email"
              required
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-lg font-medium"
            size="lg"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
          {message && (
            <p className="text-xs text-gray-500 text-center">{message}</p>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
