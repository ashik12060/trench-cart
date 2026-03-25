import React from "react";
import { Download, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBarcodeLabelSvg } from "@/lib/barcodes";

const blobToDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadSvgAsPng = async (svgElement, filename) => {
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true);
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", "900");
  clonedSvg.setAttribute("height", "600");

  const svgText = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    await new Promise((resolve) => {
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          blobToDownload(pngBlob, filename.replace(/\.svg$/i, ".png"));
        }
        resolve();
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const printSvg = (svgMarkup, title = "barcode-label") => {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: 1.5in 1in; margin: 0; }
          html, body {
            width: 1.5in;
            height: 1in;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #fff;
          }
          .sheet {
            width: 1.5in;
            height: 1in;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 1.5in;
            height: 1in;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="sheet">${svgMarkup}</div>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
            setTimeout(() => window.close(), 250);
          };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
};

export default function BarcodeLabel({
  title,
  barcode,
  kind = "product",
  sku = "",
  size = "",
  color = "",
  quantity = 0,
  price = null,
}) {
  const svgWrapRef = React.useRef(null);
  const composedSvg = React.useMemo(
    () =>
      createBarcodeLabelSvg(barcode, {
        title,
        sku,
        size,
        color,
        kind,
        quantity,
        price,
      }),
    [barcode, color, kind, price, quantity, size, sku, title],
  );

  const handleDownload = async () => {
    const svgElement = svgWrapRef.current?.querySelector("svg");
    if (!svgElement) return;
    await downloadSvgAsPng(svgElement, `${barcode || "barcode"}.png`);
  };

  const handlePrint = () => {
    printSvg(composedSvg, barcode || "barcode-label");
  };

  return (
    <div className="barcode-label-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{kind === "variant" ? "Variant Label" : "Product Label"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-0 bg-slate-900 text-white">{quantity} pcs</Badge>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleDownload} title="Download barcode image">
            <Download className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrint} title="Print barcode label">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={svgWrapRef} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-4">
        <div
          className="w-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: composedSvg }}
        />
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <p className="text-center text-sm font-semibold tracking-[0.18em] text-slate-800">{barcode}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {sku ? <span>SKU: {sku}</span> : null}
          {size ? <span>Size: {size}</span> : null}
          {color ? <span>Color: {color}</span> : null}
          {price !== null ? <span>Price: ${Number(price || 0).toFixed(2)}</span> : null}
        </div>
      </div>
    </div>
  );
}
