"use server"

import { db } from "@/lib/prisma"
import { z } from "zod"
import * as fs from 'fs';
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const fileSchema = z.instanceof(File, {message: "Required"})
const imageSchema = fileSchema.refine(
    file => file.size === 0 || file.type.startsWith("image/"),
)

const addSchema = z.object({
  name: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  description: z.string().min(1),
  image: imageSchema.refine(file => file.size > 0, "Required"),
  sizes: z.array(z.object({
    size: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional(),
  colors: z.array(z.object({
    color: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional(),
});

export async function addProduct(prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const data: Record<string, string | File | { size: string; stock: number }[] | { color: string; stock: number }[]> = { ...formEntries };

  if (data['sizes[0][size]']) {
    const sizes: { size: string, stock: number }[] = [];
    let index = 0;
    while (data[`sizes[${index}][size]`]) {
      sizes.push({
        size: String(data[`sizes[${index}][size]`]),
        stock: Number(data[`sizes[${index}][stock]`])
      });
      index++;
    }
    data.sizes = sizes;
  }

  if (data['colors[0][color]']) {
    const colors: { color: string, stock: number }[] = [];
    let index = 0;
    while (data[`colors[${index}][color]`]) {
      colors.push({
        color: String(data[`colors[${index}][color]`]),
        stock: Number(data[`colors[${index}][stock]`])
      });
      index++;
    }
    data.colors = colors;
  }
  
  const result = addSchema.safeParse(data);

  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }

  const validatedData = result.data;

  await fs.promises.mkdir('public/products', { recursive: true });

  const imagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;

  await fs.promises.writeFile(
    `public${imagePath}`,
    Buffer.from(await validatedData.image.arrayBuffer())
  );

  await db.product.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      priceInCents: validatedData.priceInCents,
      imagePath,
      sizes: {
        create: validatedData.sizes?.map(size => ({
          size: size.size,
          stock: size.stock,
        })) || [],
      },
      colors: {
        create: validatedData.colors?.map(color => ({
          color: color.color,
          stock: color.stock,
        })) || [],
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
  sizes: z.array(z.object({
    size: z.string().min(1),
    stock: z.number().int().min(0),
  })).optional(),
  colors: z.array(z.object({
    color: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional(),
});

export async function updateProduct(id: string, prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const data: Record<string, string | File | { size: string; stock: number }[] | { color: string; stock: number }[]> = { ...formEntries };

  if (data['sizes[0][size]']) {
    const sizes: { size: string, stock: number }[] = [];
    let index = 0;
    while (data[`sizes[${index}][size]`]) {
      sizes.push({
        size: String(data[`sizes[${index}][size]`]),
        stock: Number(data[`sizes[${index}][stock]`])
      });
      index++;
    }
    data.sizes = sizes;
  }

  if (data['colors[0][color]']) {
    const colors: { color: string, stock: number }[] = [];
    let index = 0;
    while (data[`colors[${index}][color]`]) {
      colors.push({
        color: String(data[`colors[${index}][color]`]),
        stock: Number(data[`colors[${index}][stock]`])
      });
      index++;
    }
    data.colors = colors;
  }
  
  const result = editSchema.safeParse(data);
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }
  
  const validatedData = result.data;

  // Fetch existing product
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  // Handle image update
  let imagePath = product.imagePath;
  if (validatedData.image && validatedData.image.size > 0) {
    const newImagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;

    try {
      if (fs.existsSync(`public${product.imagePath}`)) {
        await fs.unlink(`public${product.imagePath}`, (err) => {
            if (err) console.error("Error deleting old image:", err);
        });
      }
    } catch {
    await fs.promises.writeFile(
      `public${newImagePath}`,
      Buffer.from(await validatedData.image.arrayBuffer())
    );
    imagePath = newImagePath;
    }
  }

  await db.product.update({
    where: { id },
    data: {
      isAvailableForPurchase: false,
      name: validatedData.name,
      description: validatedData.description,
      priceInCents: validatedData.priceInCents,
      imagePath,
      sizes: {
        deleteMany: {}, // Clear old sizes
        create: validatedData.sizes?.map(size => ({
          size: size.size,
          stock: size.stock,
        })) || [],
      },
      colors: {
        deleteMany: {}, // Clear old colors
        create: validatedData.colors?.map(color => ({
          color: color.color,
          stock: color.stock,
        })) || [],
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function toggleProductAvailability(id: string, isAvailableForPurchase: boolean) {
  await db.product.update({
      where: { id },
      data: { isAvailableForPurchase },
  })

  revalidatePath("/")
  revalidatePath("/products")
}

export async function deleteProduct(id: string) {
  const product = await db.product.delete({ where: { id } })
  if (product == null) return notFound()
  await fs.unlink(`public${product.imagePath}`, (err) => {
      if (err) console.error("Error deleting image:", err);
  });

  revalidatePath("/")
  revalidatePath("/products")
}