export const getProductPrimaryImage = (product = {}, fallback = "") => {
  const directImages = Array.isArray(product?.images) ? product.images : [];
  const variantImages = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) => (Array.isArray(variant?.images) ? variant.images : []))
    : [];

  const firstImage = [...directImages, ...variantImages].find((image) => String(image || "").trim());
  return firstImage || product?.image_url || fallback;
};
