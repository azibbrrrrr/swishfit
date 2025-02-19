'use client';

import { useTransition } from 'react';
import {
  deleteProduct,
  toggleProductAvailability,
} from '../../_actions/product';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ActiveToggleButton({
  id,
  isAvailableForPurchase,
}: {
  id: string;
  isAvailableForPurchase: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleProductAvailability(id, !isAvailableForPurchase);
          router.refresh();
        });
      }}
    >
      {isPending ? (
        <Loader2 className="animate-spin w-4 h-4" />
      ) : isAvailableForPurchase ? (
        'Deactivate'
      ) : (
        'Activate'
      )}
    </Button>
  );
}

export function DeleteButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      className="px-3 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isPending || disabled}
      onClick={() => {
        startTransition(async () => {
          await deleteProduct(id);
          router.refresh();
        });
      }}
    >
      {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : 'Delete'}
    </Button>
  );
}
