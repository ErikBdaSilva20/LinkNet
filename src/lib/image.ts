interface EncodeImageOptions {
  maxDim?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

const DEFAULT_MAX_DIM = 256;
const DEFAULT_QUALITY = 0.6;
const MAX_OUTPUT_BYTES = 100 * 1024;

function supportsWebp(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

export async function encodeImageToDataUrl(
  file: File,
  opts: EncodeImageOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo selecionado não é uma imagem.");
  }

  const maxDim = opts.maxDim ?? DEFAULT_MAX_DIM;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível processar a imagem neste navegador.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const mimeType = opts.mimeType ?? (supportsWebp(canvas) ? "image/webp" : "image/jpeg");
  const dataUrl = canvas.toDataURL(mimeType, quality);

  if (dataUrlByteSize(dataUrl) > MAX_OUTPUT_BYTES) {
    console.warn(
      `encodeImageToDataUrl: imagem gerada (${Math.round(dataUrlByteSize(dataUrl) / 1024)}KB) acima do teto recomendado de ${MAX_OUTPUT_BYTES / 1024}KB.`
    );
  }

  return dataUrl;
}
