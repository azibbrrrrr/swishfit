"use server"

import { db } from "@/lib/prisma"
import { z } from "zod"
import fs from "fs/promises"
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
    stock: z.number().int().min(0)
  })).optional(),
});

export async function addProduct(prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  // Convert formData to an object and assert it as Record<string, any>
  const formEntries = Object.fromEntries(formData.entries()) as Record<string, any>;

  const data = formEntries;

  // Parse sizes array from the form data
  if (data['sizes[0][size]']) {
    const sizes: { size: string, stock: number }[] = [];
    let index = 0;
    while (data[`sizes[${index}][size]`]) {
      sizes.push({
        size: data[`sizes[${index}][size]`],
        stock: Number(data[`sizes[${index}][stock]`])
      });
      index++;
    }
    data.sizes = sizes; // Replace with structured sizes array
  }

  if (data['colors[0][color]']) {
    const colors: { color: string, stock: number }[] = [];
    let index = 0;
    while (data[`colors[${index}][color]`]) {
      colors.push({
        color: data[`colors[${index}][color]`],
        stock: Number(data[`colors[${index}][stock]`])
      });
      index++;
    }
    data.colors = colors; // Replace with structured sizes array
  }
  
  
  // Validate the data using zod schema
  const result = addSchema.safeParse(data);

  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }

  const validatedData = result.data;

  // Handle image file upload
  await fs.mkdir("public/products", { recursive: true });
  const imagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await validatedData.image.arrayBuffer())
  );

  // Prepare options based on optionType
  const options: { value: string; stock: number }[] = [];

  if (validatedData.optionType === 'size' && validatedData.sizes) {
    validatedData.sizes.forEach((sizeObj) => {
      options.push({
        value: sizeObj.size,
        stock: sizeObj.stock,
      });
    });
  }

  if (validatedData.optionType === 'color' && validatedData.colors) {
    validatedData.colors.forEach((color1) => {
      options.push({
        value: color1.color,
        stock: color1.stock,      
      });
    });
  }

  // Create the product with its options in the database
  const product = await db.product.create({
    data: {
      isAvailableForPurchase: false,
      name: validatedData.name,
      description: validatedData.description,
      priceInCents: validatedData.priceInCents,
      imagePath,
      optionType: validatedData.optionType || "", // Set to empty string if undefined
      options: {
        create: options, // Create associated ProductOption records
      },
    },
  });

  console.log("options:", options);

  // Revalidate paths and redirect
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

  // Convert formData to an object and assert it as Record<string, any>
  const formEntries = Object.fromEntries(formData.entries()) as Record<string, any>;

  const data = formEntries; // Now data has type Record<string, any>

  // Parse sizes array from the form data
  if (data['sizes[0][size]']) {
    const sizes: { size: string, stock: number }[] = [];
    let index = 0;
    while (data[`sizes[${index}][size]`]) {
      sizes.push({
        size: data[`sizes[${index}][size]`],
        stock: Number(data[`sizes[${index}][stock]`])
      });
      index++;
    }
    data.sizes = sizes; // Replace with structured sizes array
  }

  // Parse colors array from the form data
  if (data['colors[0][color]']) {
    const colors: { color: string, stock: number }[] = [];
    let index = 0;
    while (data[`colors[${index}][color]`]) {
      colors.push({
        color: data[`colors[${index}][color]`],
        stock: Number(data[`colors[${index}][stock]`])
      });
      index++;
    }
    data.colors = colors; // Replace with structured colors array
  }

  // Validate the data with the schema
  const result = editSchema.safeParse(data);
  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }

  const validatedData = result.data;
  const product = await db.product.findUnique({ where: { id } });

  if (product == null) return notFound();

  // Handle image update: If new image provided, delete old image and save new image
  let imagePath = product.imagePath;
  if (validatedData.image != null && validatedData.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`);
    imagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await validatedData.image.arrayBuffer())
    );
  }

  // Fetch current options for comparison
  const existingOptions = await db.productOption.findMany({
    where: { productId: product.id },
  });

  // Prepare options based on optionType
  const options: { value: string; stock: number }[] = [];

  if (validatedData.optionType === 'size' && validatedData.sizes) {
    validatedData.sizes.forEach((sizeObj) => {
      const existingSize = existingOptions.find((option) => option.value === sizeObj.size);
      if (existingSize) {
        // If size exists, check if the stock is different, then update
        if (existingSize.stock !== sizeObj.stock) {
          options.push({
            value: sizeObj.size,
            stock: sizeObj.stock, // Update the stock
          });
        }
      } else {
        // If size doesn't exist, add it to the options list
        options.push({
          value: sizeObj.size,
          stock: sizeObj.stock,
        });
      }
    });
  }

  if (validatedData.optionType === 'color' && validatedData.colors) {
    validatedData.colors.forEach((colorObj) => {
      const existingColor = existingOptions.find((option) => option.value === colorObj.color);
      if (existingColor) {
        // If color exists, check if the stock is different, then update
        if (existingColor.stock !== colorObj.stock) {
          options.push({
            value: colorObj.color,
            stock: colorObj.stock, // Update the stock
          });
        }
      } else {
        // If color doesn't exist, add it to the options list
        options.push({
          value: colorObj.color,
          stock: colorObj.stock,
        });
      }
    });
  }

  // Update the product with the new data
  await db.product.update({
    where: { id },
    data: {
      isAvailableForPurchase: false,
      name: validatedData.name,
      description: validatedData.description,
      priceInCents: validatedData.priceInCents,
      imagePath,
      optionType: validatedData.optionType || "", // Set to empty string if undefined
      options: {
        create: options, // Create associated ProductOption records
      },
    },
  });

  console.log("Options:", options);

  // Revalidate paths and redirect
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
    await fs.unlink(`public${product.imagePath}`);

    revalidatePath("/")
    revalidatePath("/products")
}