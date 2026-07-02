"use client";

/**
 * Compress an image File to a base64 JPEG data URL.
 * - Resizes so the longest side is at most `maxSize` (default 800px).
 * - Encodes as JPEG at `quality` (default 0.82).
 * - EXIF orientation is ignored — canvas draws the raw pixels. Acceptable
 *   for MVP; most modern mobile browsers correct this automatically via the
 *   image element.
 */
export async function compressImageToDataUrl(
  file: File,
  maxSize = 800,
  quality = 0.82
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = fit(img.naturalWidth, img.naturalHeight, maxSize);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context nem elérhető.");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Kép betöltése sikertelen."));
    img.src = src;
  });
}

function fit(
  w: number,
  h: number,
  max: number
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  if (w >= h) {
    const scale = max / w;
    return { width: max, height: Math.round(h * scale) };
  }
  const scale = max / h;
  return { width: Math.round(w * scale), height: max };
}
