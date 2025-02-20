'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Product, ProductVariation } from '@prisma/client';
import Image from 'next/image';
import { addProduct, updateProduct } from '../../_actions/product';

export function ProductForm({
  product,
}: {
  product?: (Product & { variations?: ProductVariation[] }) | null;
}) {
  const [error, action] = useActionState(
    product == null ? addProduct : updateProduct.bind(null, product.id),
    {},
  );
  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents,
  );
  const [variations, setVariations] = useState<ProductVariation[]>(
    product?.variations || [],
  );

  const addVariation = () => {
    setVariations([
      ...variations,
      { id: '', productId: product?.id || '', size: '', color: '', stock: 0 },
    ]);
  };

  const updateVariation = (
    index: number,
    key: keyof ProductVariation,
    value: string | number,
  ) => {
    const newVariations = [...variations];
    newVariations[index] = { ...newVariations[index], [key]: value };
    setVariations(newVariations);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  return (
    <form action={action} className="space-y-8">
      {/* Product name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product?.name || ''}
        />
        {error.name && <div className="text-destructive">{error.name}</div>}
      </div>

      {/* Product price in cents */}
      <div className="space-y-2">
        <Label htmlFor="priceInCents">Price In Cents</Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents}
          onChange={(e) => setPriceInCents(Number(e.target.value) || undefined)}
        />
        <div className="text-muted-foreground">
          {formatCurrency((priceInCents || 0) / 100)}
        </div>
        {error.priceInCents && (
          <div className="text-destructive">{error.priceInCents}</div>
        )}
      </div>

      {/* Product description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={product?.description}
        />
        {error.description && (
          <div className="text-destructive">{error.description}</div>
        )}
      </div>

      {/* Product Image  */}
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input type="file" id="image" name="image" required={product == null} />
        {product != null && (
          <Image
            src={product.imagePath}
            height="400"
            width="400"
            alt="Product Image"
          />
        )}
        {error.image && <div className="text-destructive">{error.image}</div>}
      </div>

      {/* Product Variations */}
      {/* Product Variations */}
      <div className="space-y-2">
        <Label>Variations</Label>
        {variations.map((variation, index) => (
          <div key={index} className="flex space-x-2">
            <Input
              type="text"
              name={`variations[${index}][size]`}
              placeholder="Size"
              value={variation.size || ''}
              onChange={(e) => updateVariation(index, 'size', e.target.value)}
            />
            <Input
              type="text"
              name={`variations[${index}][color]`}
              placeholder="Color"
              value={variation.color || ''}
              onChange={(e) => updateVariation(index, 'color', e.target.value)}
            />
            <Input
              type="number"
              name={`variations[${index}][stock]`}
              placeholder="Stock"
              value={variation.stock}
              onChange={(e) =>
                updateVariation(index, 'stock', Number(e.target.value))
              }
            />
            <Button type="button" onClick={() => removeVariation(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addVariation}>
          Add Variation
        </Button>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  );
}
