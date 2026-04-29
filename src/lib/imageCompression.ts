import imageCompression from "browser-image-compression";

/**
 * Compressão de imagens antes de upload.
 * Reduz custo do Lovable Cloud em ~70-80%.
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebp?: boolean;
  }
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const maxSizeMB = options?.maxSizeMB ?? 0.4;
  const maxWidthOrHeight = options?.maxWidthOrHeight ?? 1600;
  const useWebp = options?.useWebp ?? true;

  if (file.size <= maxSizeMB * 1024 * 1024 && !useWebp) return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: useWebp ? "image/webp" : file.type,
      initialQuality: 0.82,
    });

    if (useWebp) {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      return new File([compressed], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }

    return new File([compressed], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("[imageCompression] falhou, usando original:", err);
    return file;
  }
}

export async function compressImages(
  files: File[],
  options?: Parameters<typeof compressImage>[1]
): Promise<File[]> {
  const results: File[] = [];
  const batchSize = 4;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const compressed = await Promise.all(batch.map((f) => compressImage(f, options)));
    results.push(...compressed);
  }
  return results;
}

/**
 * Gera uma thumbnail muito pequena (320px, ~30KB) para uso em listagens/cards.
 * Reduz drasticamente o egress em vitrines com muitos cards.
 */
export async function generateThumbnail(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.04, // ~40KB
    maxWidthOrHeight: 320,
    useWebp: true,
  });
}

export const compressAvatar = (file: File) =>
  compressImage(file, { maxSizeMB: 0.15, maxWidthOrHeight: 600 });

export const compressHero = (file: File) =>
  compressImage(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1920 });

/**
 * Headers padrão para upload em Supabase Storage:
 * - cacheControl: 1 ano (navegador e CDN guardam, reduz egress)
 * - upsert opcional
 */
export const STORAGE_CACHE_HEADERS = {
  cacheControl: "31536000", // 1 ano
} as const;

/**
 * Limites de upload de vídeo (stories, hero):
 * - máximo 10MB para evitar consumo descontrolado
 */
export const MAX_VIDEO_SIZE_MB = 10;

export function validateVideoSize(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith("video/")) return { valid: true };
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_VIDEO_SIZE_MB) {
    return {
      valid: false,
      error: `Vídeo muito grande (${sizeMB.toFixed(1)}MB). Máximo: ${MAX_VIDEO_SIZE_MB}MB. Comprima antes de enviar.`,
    };
  }
  return { valid: true };
}
