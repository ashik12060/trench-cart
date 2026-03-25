const normalizeString = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const hasValue = (value) => typeof value === "string" && value.trim() !== "";

export const computeVariantStock = (variants = []) =>
  variants.reduce((total, variant) => total + (Number(variant?.quantity) || 0), 0);

export const recalcStockFromVariants = (product) => {
  if (!product) return 0;
  const total = computeVariantStock(product.variants);
  product.stock_quantity = total;
  return total;
};

export const findVariantByAttributes = (product = {}, attrs = {}) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length === 0) return null;

  const sku = normalizeString(attrs.variant_sku);
  if (sku) {
    const match = variants.find((variant) => normalizeString(variant?.sku) === sku);
    if (match) return match;
  }

  const color = normalizeString(attrs.variant_color);
  const size = normalizeString(attrs.variant_size);
  const hasColor = hasValue(attrs.variant_color);
  const hasSize = hasValue(attrs.variant_size);

  return variants.find((variant) => {
    if (hasColor && normalizeString(variant?.color) !== color) {
      return false;
    }
    if (hasSize && normalizeString(variant?.size) !== size) {
      return false;
    }
    return true;
  }) || null;
};