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
    stock: z.number().int().min(0)
  })).optional(),
});

export async function addProduct(prevState: unknown, formData: FormData) {
  console.log("Form Data:", Object.fromEntries(formData.entries()));

  // Convert formData to an object and assert it as Record<string, any>
  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const data: Record<string, string | File | { size: string; stock: number }[] | { color: string; stock: number }[]> = { ...formEntries }; // ✅ Explicitly allow arrays


  // Parse sizes array from the form data
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
    data.sizes = sizes; // Replace with structured sizes array
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
    data.colors = colors; // Replace with structured sizes array
  }
  
  
  // Validate the data using zod schema
  const result = addSchema.safeParse(data);

  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }

  const validatedData = result.data;

  // Handle image file upload
  await fs.promises.mkdir('public/products', { recursive: true }); // Ensure the 'products' directory exists

  const imagePath = `/products/${crypto.randomUUID()}-${validatedData.image.name}`;

  // Use the promise-based fs.promises.writeFile
  await fs.promises.writeFile(
    `public${imagePath}`,
    Buffer.from(await validatedData.image.arrayBuffer()) // Convert the image data to a buffer
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
  await db.product.create({
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

  // Convert FormData to a structured object
  const formEntries = Object.fromEntries(formData.entries()) as Record<string, string | File>;
  const parsedData: {
    name?: string;
    description?: string;
    priceInCents?: number;
    optionType?: string;
    sizes?: { size: string; stock: number }[];
    colors?: { color: string; stock: number }[];
    image?: File;
  } = {};

  // Parse sizes array from form data
  if (formEntries['sizes[0][size]']) {
    const sizes: { size: string; stock: number }[] = [];
    let index = 0;
    while (formEntries[`sizes[${index}][size]`]) {
      const size = String(formEntries[`sizes[${index}][size]`]);
      const stock = Number(formEntries[`sizes[${index}][stock]`] ?? 0);
      if (!isNaN(stock)) sizes.push({ size, stock });
      index++;
    }
    parsedData.sizes = sizes;
  }

  // Parse colors array from form data
  if (formEntries['colors[0][color]']) {
    const colors: { color: string; stock: number }[] = [];
    let index = 0;
    while (formEntries[`colors[${index}][color]`]) {
      const color = String(formEntries[`colors[${index}][color]`]);
      const stock = Number(formEntries[`colors[${index}][stock]`] ?? 0);
      if (!isNaN(stock)) colors.push({ color, stock });
      index++;
    }
    parsedData.colors = colors;
  }

  // Validate data with Zod schema
  const result = editSchema.safeParse({ ...formEntries, ...parsedData });
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
  

   // Fetch current options for comparison
   const existingOptions = await db.productOption.findMany({
    where: { productId: product.id },
  });

  if (validatedData.optionType === 'size' && validatedData.sizes) {
    for (const sizeObj of validatedData.sizes) {
      const existingSize = existingOptions.find((option) => option.value === sizeObj.size);

      if (!existingSize) {
        // Create a new size if it doesn't exist
        await db.productOption.create({
          data: {
            productId: product.id,
            value: sizeObj.size,
            stock: sizeObj.stock,
          },
        });
      } else if (existingSize.stock !== sizeObj.stock) {
        // Update stock if it exists but stock is different
        await db.productOption.update({
          where: { id: existingSize.id },
          data: { stock: sizeObj.stock },
        });
      }
    }
  }

  if (validatedData.optionType === 'color' && validatedData.colors) {
    for (const colorObj of validatedData.colors) {
      const existingColor = existingOptions.find((option) => option.value === colorObj.color);

      if (!existingColor) {
        // Create a new color if it doesn't exist
        await db.productOption.create({
          data: {
            productId: product.id,
            value: colorObj.color,
            stock: colorObj.stock,
          },
        });
      } else if (existingColor.stock !== colorObj.stock) {
        // Update stock if it exists but stock is different
        await db.productOption.update({
          where: { id: existingColor.id },
          data: { stock: colorObj.stock },
        });
      }
    }
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
    },
  });

  console.log("Options updated:", validatedData.sizes);

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
    await fs.unlink(`public${product.imagePath}`, (err) => {
        if (err) console.error("Error deleting image:", err);
    });

    revalidatePath("/")
    revalidatePath("/products")
}