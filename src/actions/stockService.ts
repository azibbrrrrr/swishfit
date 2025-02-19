import { db } from "@/lib/prisma";

/**
 * Create a product with stock variations (sizes, colors)
 */
export const createProductWithStock = async (
  name: string,
  priceInCents: number,
  imagePath: string,
  description: string,
  isAvailableForPurchase: boolean,
  variations: { size?: string; color?: string; stock: number }[]
) => {
  return await db.product.create({
    data: {
      name,
      priceInCents,
      imagePath,
      description,
      isAvailableForPurchase,
      variations: {
        create: variations.map(v => ({
          size: v.size || null,
          color: v.color || null,
          stock: v.stock,
        })),
      },
    },
    include: { variations: true },
  });
};

/**
 * Update stock variations for a product
 * - If variation exists → update stock
 * - If variation does not exist → create new variation
 */
export const updateStock = async (
  productId: string,
  updates: { size?: string; color?: string; stock: number }[]
) => {
  for (const update of updates) {
    const existingVariation = await db.productVariation.findFirst({
      where: {
        productId,
        size: update.size || null,
        color: update.color || null,
      },
    });

    if (existingVariation) {
      // Update existing variation
      await db.productVariation.update({
        where: { id: existingVariation.id },
        data: { stock: update.stock },
      });
    } else {
      // Create new variation
      await db.productVariation.create({
        data: {
          productId,
          size: update.size || null,
          color: update.color || null,
          stock: update.stock,
        },
      });
    }
  }
};

/**
 * Delete all existing stock variations and create new ones
 */
export const replaceAllStock = async (
  productId: string,
  newVariants: { size?: string; color?: string; stock: number }[]
) => {
  await db.productVariation.deleteMany({
    where: { productId },
  });

  await db.productVariation.createMany({
    data: newVariants.map(v => ({
      productId,
      size: v.size || null,
      color: v.color || null,
      stock: v.stock,
    })),
  });
};

export const decreaseStock = async (
  productId: string,
  filters: { size?: string; color?: string },
  amountToDecrease: number
) => {
  if (!filters.size && !filters.color) {
    throw new Error("At least one of size or color must be provided.");
  }

  const existingVariation = await db.productVariation.findFirst({
    where: {
      productId,
      ...(filters.size && { size: filters.size }),
      ...(filters.color && { color: filters.color }),
    },
  });

  if (!existingVariation) {
    throw new Error("Stock variation not found.");
  }

  const newStock = Math.max(0, existingVariation.stock - amountToDecrease);

  return await db.productVariation.update({
    where: { id: existingVariation.id },
    data: { stock: newStock },
  });
};

