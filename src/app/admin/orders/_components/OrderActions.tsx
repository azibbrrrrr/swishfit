'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder } from '../../_actions/orders';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export function DeleteDropDownItem({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteOrder(id);
          router.refresh();
        })
      }
      className="flex items-center gap-2"
    >
      <Trash className="h-4 w-4" />
      Delete
    </Button>
  );
}
