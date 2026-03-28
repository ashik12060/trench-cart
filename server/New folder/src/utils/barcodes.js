import crypto from "node:crypto";

const cleanSegment = (value, maxLength = 10) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, maxLength);

export const normalizeBarcodeValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 60);

const currentYearSuffix = () => String(new Date().getFullYear()).slice(-2);

const randomDigits = (minLength = 4, maxLength = 5) => {
  const length = crypto.randomInt(minLength, maxLength + 1);
  const maxValue = 10 ** length;
  return String(crypto.randomInt(0, maxValue)).padStart(length, "0");
};

export const variantSuffixFromIndex = (index = 0) => {
  let current = Number(index) || 0;
  let suffix = "";

  do {
    suffix = String.fromCharCode(65 + (current % 26)) + suffix;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);

  return suffix;
};

export const buildProductBarcodeBase = (product = {}) => {
  const prefix = `TC${currentYearSuffix()}`;
  const skuSegment = cleanSegment(product?.sku || product?.name, 8);
  return normalizeBarcodeValue(`${prefix}${skuSegment}`);
};

export const generateProductBarcode = (product = {}) =>
  normalizeBarcodeValue(`${buildProductBarcodeBase(product)}${randomDigits(4, 5)}`);

export const buildVariantBarcode = ({ parentBarcode = "", index = 0 } = {}) =>
  normalizeBarcodeValue(`${normalizeBarcodeValue(parentBarcode)}${variantSuffixFromIndex(index)}`);
