import JsBarcode from "jsbarcode";

const normalizeBarcodeValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 60);

const cleanSegment = (value, maxLength = 10) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, maxLength);

const currentYearSuffix = () => String(new Date().getFullYear()).slice(-2);

const randomDigits = (minLength = 4, maxLength = 5) => {
  const length = Math.random() < 0.5 ? minLength : maxLength;
  const maxValue = 10 ** length;
  return String(Math.floor(Math.random() * maxValue)).padStart(length, "0");
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

export const ensureClientBarcodes = (product = {}) => {
  const expectedBase = buildProductBarcodeBase(product);
  const normalizedBarcode = normalizeBarcodeValue(product?.barcode);
  const nextProductBarcode =
    normalizedBarcode && normalizedBarcode.startsWith(expectedBase)
      ? normalizedBarcode
      : generateProductBarcode(product);

  const nextProduct = {
    ...product,
    barcode: nextProductBarcode,
  };

  nextProduct.variants = (Array.isArray(product?.variants) ? product.variants : []).map((variant, index) => ({
    ...variant,
    barcode: normalizeBarcodeValue(variant?.barcode) || buildVariantBarcode({ parentBarcode: nextProduct.barcode, index }),
  }));

  return nextProduct;
};

export const normalizeClientBarcode = normalizeBarcodeValue;

const escapeXml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderBarcodeSvgMarkup = (barcode) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, barcode, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    width: 1.5,
    height: 42,
    background: "#ffffff",
    lineColor: "#0f172a",
  });

  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "216");
  svg.setAttribute("height", "62");
  return svg.outerHTML;
};

export const createBarcodeLabelSvg = (barcode, meta = {}) => {
  if (!barcode) {
    throw new Error("Barcode value is required");
  }

  const title = escapeXml(meta.title || "");
  const sku = escapeXml(meta.sku || "");
  const size = escapeXml(meta.size || "");
  const color = escapeXml(meta.color || "");
  const kind = escapeXml(meta.kind || "Product");
  const quantity = escapeXml(meta.quantity !== undefined ? `${meta.quantity}` : "");
  const price = meta.price !== undefined && meta.price !== null ? `$${Number(meta.price || 0).toFixed(2)}` : "";
  const barcodeSvg = renderBarcodeSvgMarkup(barcode);
  const bottomLine = [sku ? `SKU: ${sku}` : "", size ? `Size: ${size}` : "", color ? `Color: ${color}` : "", quantity ? `Qty: ${quantity}` : "", price ? `Price: ${price}` : ""]
    .filter(Boolean)
    .join("  ");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1.5in" height="1in" viewBox="0 0 300 200">
      <rect width="300" height="200" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <text x="150" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${title || kind}</text>
      <text x="150" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" letter-spacing="1.5" fill="#64748b">${kind.toUpperCase()}</text>
      <text x="150" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="600" fill="#334155">${sku ? `SKU: ${sku}` : ""}</text>
      <g transform="translate(42, 54)">
        ${barcodeSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
      </g>
      <text x="150" y="154" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="700" letter-spacing="2" fill="#0f172a">${escapeXml(barcode)}</text>
      <text x="150" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#475569">${escapeXml(bottomLine)}</text>
    </svg>
  `.trim();
};

export const createBarcodeSvgFile = async (barcode, filename = "barcode.svg", meta = {}) => {
  const svgText = createBarcodeLabelSvg(barcode, meta);

  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  return new File([blob], filename, { type: "image/svg+xml" });
};
