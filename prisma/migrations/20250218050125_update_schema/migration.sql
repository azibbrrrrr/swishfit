-- CreateIndex
CREATE INDEX "ProductColor_productId_idx" ON "ProductColor"("productId");

-- CreateIndex
CREATE INDEX "ProductSize_productColorId_idx" ON "ProductSize"("productColorId");
