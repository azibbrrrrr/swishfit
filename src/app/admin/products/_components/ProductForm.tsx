'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../../_actions/product';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Product } from '@prisma/client';
import Image from 'next/image';

export function ProductForm({ product }: { product?: Product | null }) {
  const [error, action] = useActionState(
    product == null ? addProduct : updateProduct.bind(null, product.id),
    {},
  );
  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents,
  );
  const [optionType, setOptionType] = useState('');
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [colors, setColors] = useState<{ color: string; stock: number }[]>([]);

  // // Print options list if it exists
  // if (product.options && product.options.length > 0) {
  //   console.log('Product options:', product.options);
  // } else {
  //   console.log('No options');
  // }
  // console.log('OPtions:', product?.options);

  useEffect(() => {
    // Pre-fill the option types based on the product options
    if (product) {
      setOptionType(product.optionType);

      // Handle the 'size' option type
      if (product.optionType === 'size') {
        const sizeOptions = product.options
          .filter((option) => option.value) // Assuming 'value' is the size name
          .map((option) => ({
            size: option.value, // Option value (size)
            stock: option.stock || 0, // Ensure stock is set to 0 if not available
          }));
        setSizes(sizeOptions);
      }

      // Handle the 'color' option type
      if (product.optionType === 'color') {
        const colorOptions = product.options
          .filter((option) => option.value) // Assuming 'value' is the color name
          .map((option) => option.value); // Only map the color names
        setColors(colorOptions);
      }
    }
  }, [product]);

  const addSize = () => {
    setSizes([...sizes, { size: '', stock: 0 }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: string, value: string | number) => {
    const newSizes = sizes.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    setSizes(newSizes);
  };

  const addColor = () => {
    setColors([...colors, { color: '', stock: 0 }]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const updateColor = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newColors = colors.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    setColors(newColors);
  };

  return (
    <form action={action} className="space-y-8">
      {/* Name Field */}
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

      {/* Price In Cents Field */}
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

      {/* Description Field */}
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

      {/* Option Type Field */}
      <div className="space-y-2">
        <Label>Option Type</Label>
        <select
          className="border p-2 rounded w-full"
          id="optionType"
          name="optionType"
          value={optionType}
          onChange={(e) => setOptionType(e.target.value)}
        >
          <option value="">Select Option Type</option>
          <option value="size">Size</option>
          <option value="color">Color</option>
        </select>
      </div>

      {/* Sizes Input */}
      {optionType === 'size' && (
        <div className="space-y-2">
          <Label>Sizes & Stock</Label>
          {sizes.map((size, index) => (
            <div key={index} className="flex space-x-2">
              {/* Size Input */}
              <Input
                type="text"
                placeholder="Size"
                value={size.size}
                onChange={(e) => updateSize(index, 'size', e.target.value)}
                name={`sizes[${index}][size]`} // Add unique name for each size input
                id={`size-${index}`} // Add unique id for each size input
              />

              {/* Stock Input */}
              <Input
                type="number"
                placeholder="Stock"
                value={size.stock}
                onChange={(e) =>
                  updateSize(index, 'stock', Number(e.target.value))
                }
                name={`sizes[${index}][stock]`} // Add unique name for each stock input
                id={`stock-${index}`} // Add unique id for each stock input
              />
              <Button type="button" onClick={() => removeSize(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addSize}>
            Add Size
          </Button>
        </div>
      )}

      {/* Colors Input */}
      {optionType === 'color' && (
        <div className="space-y-2">
          <Label>Colors</Label>
          {colors.map((color, index) => (
            <div key={index} className="flex space-x-2">
              {/* Size Input */}
              <Input
                type="text"
                placeholder="Size"
                value={color.color}
                onChange={(e) => updateColor(index, 'color', e.target.value)}
                name={`colors[${index}][color]`} // Add unique name for each size input
                id={`color-${index}`} // Add unique id for each size input
              />

              {/* Stock Input */}
              <Input
                type="number"
                placeholder="Stock"
                value={color.stock}
                onChange={(e) =>
                  updateColor(index, 'stock', Number(e.target.value))
                }
                name={`colors[${index}][stock]`} // Add unique name for each stock input
                id={`stock-${index}`} // Add unique id for each stock input
              />
              <Button type="button" onClick={() => removeColor(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addColor}>
            Add Color
          </Button>
        </div>
      )}

      {/* Image Upload Field */}
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

      {/* Submit Button */}
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
