'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '../../_actions/users';
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
          await deleteUser(id);
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
