'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../../_actions/product';
import { useActionState } from 'react';
import { Product } from '@prisma/client';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';

export function ProductForm({ product }: { product?: Product | null }) {
  const [error, action] = useActionState(
    product == null ? addProduct : updateProduct.bind(null, product.id),
    {},
  );
  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents,
  );
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [colors, setColors] = useState<
    {
      color: string;
      stock: number;
      hasSize: boolean;
      sizes?: { size: string; stock: number }[];
    }[]
  >([]);
  const [hasColor, setHasColor] = useState<boolean>(product?.hasColor || false);

  useEffect(() => {
    if (product) {
      if (product.sizes) {
        setSizes(
          product.sizes.map((size) => ({ size: size.size, stock: size.stock })),
        );
      }
      if (product.colors) {
        setColors(
          product.colors.map((color) => ({
            color: color.color,
            stock: color.stock,
            hasSize: color.hasSize || false,
            sizes: color.sizes || [],
          })),
        );
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

  const addColorSize = (colorIndex: number) => {
    const newColors = [...colors];
    const newSize = { size: '', stock: 0 };
    if (newColors[colorIndex].sizes) {
      newColors[colorIndex].sizes.push(newSize);
    }
    setColors(newColors);
  };

  const removeColorSize = (colorIndex: number, sizeIndex: number) => {
    const newColors = [...colors];
    if (newColors[colorIndex].sizes) {
      newColors[colorIndex].sizes = newColors[colorIndex].sizes.filter(
        (_, i) => i !== sizeIndex,
      );
    }
    setColors(newColors);
  };

  const updateColorSize = (
    colorIndex: number,
    sizeIndex: number,
    field: string,
    value: string | number,
  ) => {
    const newColors = [...colors];
    if (newColors[colorIndex].sizes) {
      newColors[colorIndex].sizes[sizeIndex] = {
        ...newColors[colorIndex].sizes[sizeIndex],
        [field]: value,
      };
    }
    setColors(newColors);
  };

  const addColor = () => {
    setColors([...colors, { color: '', stock: 0, hasSize: false, sizes: [] }]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const updateColor = (
    index: number,
    field: string,
    value: string | number | boolean,
  ) => {
    const newColors = colors.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    setColors(newColors);
  };

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-2">
        {/* Name label */}
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

      <div className="space-y-2">
        {/* Price in cents label */}
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

      <div className="space-y-2">
        {/* Description label */}
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

      <div className="space-y-2">
        {/* Checkbox for Has Color */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="hasColor">Has Color Options?</Label>
          <input
            type="checkbox"
            id="hasColor"
            name="hasColor"
            checked={hasColor}
            onChange={() => setHasColor(!hasColor)}
          />
        </div>
      </div>

      {/* Size & Stock or Size Management for Color */}
      <div className="space-y-6">
        {hasColor ? (
          // Size Management for Color
          <div className="space-y-6">
            <Label className="text-lg font-semibold">Colors</Label>
            {colors.map((color, index) => (
              <div
                key={index}
                className="space-y-6 p-4 border border-muted rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Input
                    type="text"
                    placeholder="Color"
                    value={color.color}
                    onChange={(e) =>
                      updateColor(index, 'color', e.target.value)
                    }
                    name={`colors[${index}][color]`}
                    id={`color-${index}`}
                    className="border border-muted rounded-lg px-3 py-2 w-48"
                  />

                  <Input
                    type="number"
                    placeholder="Stock"
                    value={color.stock}
                    onChange={(e) =>
                      updateColor(index, 'stock', Number(e.target.value))
                    }
                    name={`colors[${index}][stock]`}
                    id={`stock-${index}`}
                    disabled={color.hasSize}
                    className="border border-muted rounded-lg px-3 py-2 w-32"
                  />
                </div>

                {/* Size Management for Color */}
                {color.hasSize && (
                  <div className="space-y-4 mt-4">
                    {color.sizes?.map((size, sizeIndex) => (
                      <div
                        key={sizeIndex}
                        className="flex items-center space-x-4"
                      >
                        <Input
                          type="text"
                          placeholder="Size (e.g. S, M, L)"
                          value={size.size}
                          onChange={(e) =>
                            updateColorSize(
                              index,
                              sizeIndex,
                              'size',
                              e.target.value,
                            )
                          }
                          name={`colors[${index}][sizes][${sizeIndex}][size]`}
                          id={`size-${index}-${sizeIndex}`}
                          className="border border-muted rounded-lg px-3 py-2 w-40"
                        />

                        <Input
                          type="number"
                          placeholder="Stock"
                          value={size.stock}
                          onChange={(e) =>
                            updateColorSize(
                              index,
                              sizeIndex,
                              'stock',
                              Number(e.target.value),
                            )
                          }
                          name={`colors[${index}][sizes][${sizeIndex}][stock]`}
                          id={`stock-${index}-${sizeIndex}`}
                          className="border border-muted rounded-lg px-3 py-2 w-32"
                        />
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white rounded-md py-2 px-4"
                          type="button"
                          onClick={() => removeColorSize(index, sizeIndex)}
                        >
                          Remove Size
                        </Button>
                      </div>
                    ))}
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white rounded-md py-2 px-4"
                      type="button"
                      onClick={() => addColorSize(index)}
                    >
                      Add Size for {color.color}
                    </Button>
                  </div>
                )}
                <div className="flex items-center">
                  <Label className="mr-2">Has Sizes?</Label>
                  <input
                    type="checkbox"
                    checked={color.hasSize}
                    onChange={() =>
                      updateColor(index, 'hasSize', !color.hasSize)
                    }
                  />
                </div>

                <Button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-md py-2 px-4"
                  type="button"
                  onClick={() => removeColor(index)}
                >
                  Remove Color
                </Button>
              </div>
            ))}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 px-4"
              type="button"
              onClick={addColor}
            >
              Add Color
            </Button>
          </div>
        ) : (
          // Size & Stock
          <div className="space-y-4">
            {sizes.map((size, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 border border-muted rounded-lg"
              >
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Size (e.g., S, M, L)"
                    value={size.size}
                    onChange={(e) => updateSize(index, 'size', e.target.value)}
                    name={`sizes[${index}][size]`}
                    id={`size-${index}`}
                    className="border border-muted rounded-lg px-3 py-2 w-40"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={size.stock}
                    onChange={(e) =>
                      updateSize(index, 'stock', Number(e.target.value))
                    }
                    name={`sizes[${index}][stock]`}
                    id={`stock-${index}`}
                    className="border border-muted rounded-lg px-3 py-2 w-32"
                  />
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-md py-2 px-4"
                  type="button"
                  onClick={() => removeSize(index)}
                >
                  Remove Size
                </Button>
              </div>
            ))}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 px-4"
              type="button"
              onClick={addSize}
            >
              Add Size
            </Button>
          </div>
        )}
      </div>

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
