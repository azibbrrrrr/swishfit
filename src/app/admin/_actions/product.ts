"use server"

import { z } from "zod"
import fs from "fs/promises"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createProductWithStock, replaceAllStock, updateStock } from "@/actions/stockService"
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
  file: fileSchema.refine(file => file.size > 0, "Required"),
  image: imageSchema.refine(file => file.size > 0, "Required"),
})

export async function addProduct(prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!result.success) return result.error.formErrors.fieldErrors

  const data = result.data

  // Extract variations from formData
  const variations: { size?: string; color?: string; stock: number }[] = [];

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^variations\[(\d+)]\[(size|color|stock)]$/);
    if (match) {
      const index = Number(match[1]); // Extract index (0, 1, 2...)
      if (!variations[index]) variations[index] = { stock: 0 }; // Ensure object exists
  
      const field = match[2]; // Extract field name: "size", "color", or "stock"
      if (field === "stock") {
        variations[index].stock = Number(value); // Convert stock to number
      } else {
        (variations[index] as Record<string, any>)[field] = value; // Assign size/color
      }
    }
  }  

  // Validate variations
  const validatedVariations = variations.map(v => variationSchema.parse(v))

  // Store product file & image
  await fs.mkdir("products", { recursive: true })
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))

  await fs.mkdir("public/products", { recursive: true })
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await data.image.arrayBuffer())
  )

  // Create product with variations
  await createProductWithStock(
    data.name,
    data.priceInCents,
    imagePath,
    data.description,
    false, // Initially not available for purchase
    validatedVariations
  )

  revalidatePath("/")
  revalidatePath("/products")
  redirect("/admin/products")
}

const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
})

export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!result.success) return result.error.formErrors.fieldErrors

  const data = result.data

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
      } else {
        (variations[index] as Record<string, any>)[field] = value; // Assign size/color
      }
    }
  }
  
  const validatedVariations = variations.map(v => variationSchema.parse(v))

  // Update stock variations
  await replaceAllStock(id, validatedVariations)

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