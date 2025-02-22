"use server"

import { z } from "zod"
import fs from "fs/promises"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createProductWithStock, replaceAllStock } from "@/actions/stockService"
import { db } from "@/lib/prisma"

// Validation schemas
const fileSchema = z.instanceof(File, { message: "Required" })
const imageSchema = fileSchema.refine(
  file => file.size === 0 || file.type.startsWith("image/")
)

const variationSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  stock: z.coerce.number().int().min(0),
})

const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  image: imageSchema.refine(file => file.size > 0, "Required"),
})

export async function addProduct(prevState: unknown, formData: FormData) {
  console.log("Received form data:", Object.fromEntries(formData.entries()));

  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    console.log("Validation failed:", result.error.formErrors.fieldErrors);
    return result.error.formErrors.fieldErrors;
  }

  const data = result.data;
  console.log("Validated product data:", data);

  // Extract variations from formData
  const variations: { size?: string; color?: string; stock: number }[] = [];

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^variations\[(\d+)]\[(size|color|stock)]$/);
    if (match) {
      const index = Number(match[1]); // Extract index (0, 1, 2...)
      if (!variations[index]) variations[index] = { stock: 0 }; // Ensure object exists
  
      const field = match[2] as "size" | "color" | "stock"; // Explicitly define as valid keys
      if (field === "stock") {
        variations[index].stock = Number(value); // Convert stock to number
      } else {
        variations[index][field] = value as string; // Type assertion
      }
    }
  }
  
  console.log("Extracted variations:", variations);

    // Validate variations
    const validatedVariations = variations.map(v => variationSchema.parse(v));
    console.log("Validated variations:", validatedVariations);

    // Store product image
    await fs.mkdir("public/products", { recursive: true });
    const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()));
    console.log("Saved product image at:", imagePath);

    // Create product with variations
    const createdProduct = await createProductWithStock(
      data.name,
      data.priceInCents,
      imagePath,
      data.description,
      false, // Initially not available for purchase
      validatedVariations
    );

    console.log("Product successfully inserted into database:", createdProduct);

    revalidatePath("/")
    revalidatePath("/products")
  
    redirect("/admin/products")
  }

const editSchema = addSchema.extend({
  image: imageSchema.optional(),
})

export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!result.success) return result.error.formErrors.fieldErrors

  const data = result.data;
  console.log("Validated product data:", data);
  // Extract variations from FormData
  const variations: { size?: string; color?: string; stock: number }[] = [];

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^variations\[(\d+)]\[(size|color|stock)]$/);
    if (match) {
      const index = Number(match[1]); // Extract index (0, 1, 2...)
      if (!variations[index]) variations[index] = { stock: 0 }; // Ensure object exists
  
      const field = match[2]; // Extract field name: "size", "color", or "stock"
      if (field === "stock") {
        variations[index].stock = Number(value); // Convert stock to number
      }  else if (field === "size" || field === "color") {
        variations[index][field] = value as string; 
      }
    }
  }
  
  const validatedVariations = variations.map(v => variationSchema.parse(v))

  // Update stock variations
  await replaceAllStock(id, validatedVariations)

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  //Delete old file and replace new one
  let imagePath = product.imagePath
  if (data.image != null && data.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`)
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer())
    )
  }

  await db.product.update({
    where: { id },
    data: {
      isAvailableForPurchase: false,
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      imagePath,
    },
  });

  revalidatePath("/")
  revalidatePath("/products")
  redirect("/admin/products")
}


export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
) {
  await db.product.update({ where: { id }, data: { isAvailableForPurchase } })

  revalidatePath("/")
  revalidatePath("/products")
}

export async function deleteProduct(id: string) {
  const product = await db.product.delete({ where: { id } })

  if (product == null) return notFound()

  await fs.unlink(`public${product.imagePath}`)

  revalidatePath("/")
  revalidatePath("/products")
}