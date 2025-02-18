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
  optionType: z.string().optional(),
  sizes: z.array(z.object({
    size: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional(),
  colors: z.array(z.object({
    color: z.string().min(1),
    stock: z.number().int().min(0),
    sizes: z.array(z.object({
      size: z.string().min(1),
      stock: z.number().int().min(0),
    })).optional(), // Optional sizes for each color
  })).optional(),
});
export async function addProduct(prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const data: Record<string, string | File | { size: string; stock: number }[] | { color: string; stock: number; sizes: { size: string; stock: number }[] }[]> = { ...formEntries };

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
    const colors: { color: string; stock: number; sizes: { size: string; stock: number }[] }[] = [];
    let index = 0;
  
    while (data[`colors[${index}][color]`]) {
      const color = String(data[`colors[${index}][color]`]);
      const stock = Number(data[`colors[${index}][stock]`]) || 0;
      const colorSizes: { size: string; stock: number }[] = [];
  
      let sizeIndex = 0;
      while (data[`colors[${index}][sizes][${sizeIndex}][size]`] !== undefined) {
        const colorSize = String(data[`colors[${index}][sizes][${sizeIndex}][size]`]);
        const sizeStock = Number(data[`colors[${index}][sizes][${sizeIndex}][stock]`]) || 0;
        colorSizes.push({ size: colorSize, stock: sizeStock });
        sizeIndex++;
      }
  
      if (colorSizes.length > 0) {
        colors.push({ color, stock, sizes: colorSizes });
      }
  
      index++;
    }
  
    if (colors.length > 0) {
      data.colors = colors;
    }
  }
  
  console.log("data colours input:", JSON.stringify(data.colors, null, 2));

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

  const product = await db.product.create({
    data: {
      isAvailableForPurchase: false,
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
    },
  });

  if (validatedData.colors && validatedData.colors.length > 0) {
    for (const color of validatedData.colors) {
      const createdColor = await db.productColor.create({
        data: {
          color: color.color,
          stock: color.stock,
          productId: product.id,
        },
      });

      if (color.sizes && color.sizes.length > 0) {
        await db.productSize.createMany({
          data: color.sizes.map(size => ({
            size: size.size,
            stock: size.stock,
            productId: product.id,
            productColorId: createdColor.id,
          })),
        });
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}


const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
  sizes: z.array(z.object({
    size: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional(),
  colors: z.array(z.object({
    color: z.string().min(1),
    stock: z.number().int().min(0),
    sizes: z.array(z.object({
      size: z.string().min(1),
      stock: z.number().int().min(0),
    })).optional(), // Optional sizes for each color
  })).optional(),
});

export async function updateProduct(id: string, prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const data: Record<string, string | File | { size: string; stock: number }[] | { color: string; stock: number; sizes: { size: string; stock: number }[] }[]> = { ...formEntries };

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
    const colors: { color: string; stock: number; sizes: { size: string; stock: number }[] }[] = [];
    let index = 0;
  
    while (data[`colors[${index}][color]`]) {
      const color = String(data[`colors[${index}][color]`]);
      const stock = Number(data[`colors[${index}][stock]`]) || 0;
      const colorSizes: { size: string; stock: number }[] = [];
  
      let sizeIndex = 0;
      while (data[`colors[${index}][sizes][${sizeIndex}][size]`] !== undefined) {
        const colorSize = String(data[`colors[${index}][sizes][${sizeIndex}][size]`]);
        const sizeStock = Number(data[`colors[${index}][sizes][${sizeIndex}][stock]`]) || 0;
        colorSizes.push({ size: colorSize, stock: sizeStock });
        sizeIndex++;
      }
  
      if (colorSizes.length > 0) {
        colors.push({ color, stock, sizes: colorSizes });
      }
  
      index++;
    }
  
    if (colors.length > 0) {
      data.colors = colors;
    }
  }
  
  console.log("data colours input:", JSON.stringify(data.colors, null, 2));


  const result = editSchema.safeParse(data);
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }

  const validatedData = result.data;

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  let imagePath = product.imagePath;
  if (validatedData.image && validatedData.image.size > 0) {
    const newImagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;
    if (fs.existsSync(`public${product.imagePath}`)) {
      await fs.unlink(`public${product.imagePath}`);
    }
    await fs.promises.writeFile(
      `public${newImagePath}`,
      Buffer.from(await validatedData.image.arrayBuffer())
    );
    imagePath = newImagePath;
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
        deleteMany: { productColorId: null }, // Only remove sizes that are NOT associated with a color
        create: validatedData.sizes?.map(size => ({
          size: size.size,
          stock: size.stock,
        })) || [],
      },
    },
  });
  
  if (validatedData.colors && validatedData.colors.length > 0) {
    for (const color of validatedData.colors) {
      // Find or create the color entry for this product
      let createdColor = await db.productColor.findUnique({
        where: {
          productId_color: {
            productId: id,
            color: color.color,
          },
        },
      });
  
      if (!createdColor) {
        // If the color does not exist, create it
        createdColor = await db.productColor.create({
          data: {
            productId: id,
            color: color.color,
            stock: 0, // Set initial stock if necessary
          },
        });
      }
  
      if (color.sizes && color.sizes.length > 0) {
        for (const size of color.sizes) {
          // Find an existing ProductSize using productColorId
          const existingProductSize = await db.productSize.findFirst({
            where: {
              productColorId: createdColor.id,
              size: size.size,
            },
          });
  
          if (existingProductSize) {
            // If the product size exists for this color, update stock
            await db.productSize.update({
              where: {
                id: existingProductSize.id,
              },
              data: {
                stock: size.stock,
              },
            });
          } else {
            // If it does not exist, create a new entry
            await db.productSize.create({
              data: {
                productId: id,
                size: size.size,
                stock: size.stock,
                productColorId: createdColor.id, // Associate with the correct color
              },
            });
          }
        }
      }
    }
  }
  
  
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