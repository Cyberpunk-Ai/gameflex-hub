/**
 * GameFlex Media & Resource Optimization Utility
 * Provides image URL optimization, client-side lossless/high-efficiency compression,
 * and video resource optimization helpers.
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: "webp" | "jpg" | "auto";
}

/**
 * Transforms external or storage image URLs to include responsive width, format, and quality parameters.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {},
): string {
  if (!url) return "";

  const { width = 640, quality = 75, format = "auto" } = options;

  // Optimize Unsplash images dynamically
  if (url.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("auto", format === "auto" ? "format" : format);
      urlObj.searchParams.set("fit", "crop");
      urlObj.searchParams.set("q", quality.toString());

      const existingW = urlObj.searchParams.get("w");
      if (options.width || !existingW || Number(existingW) > 1000) {
        urlObj.searchParams.set("w", width.toString());
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Preserve pinimg.com images as-is
  if (url.includes("i.pinimg.com")) {
    return url;
  }

  return url;
}

/**
 * Client-side high-fidelity image helper.
 * Preserves full original resolution and ultra-high quality (98%) for posts.
 */
export async function compressImageFile(
  file: File,
  maxDimension: number = 3840,
  quality: number = 0.98,
): Promise<Blob> {
  // If not an image or SVG/GIF, or if file size is under 8MB, return raw original file for pristine 100% quality
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif" ||
    file.size <= 8 * 1024 * 1024
  ) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Apply smooth bilinear interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Attempt WebP output first for optimal compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to JPEG if WebP blob generation fails
              canvas.toBlob((jpegBlob) => resolve(jpegBlob || file), "image/jpeg", quality);
            }
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Helper props for high-performance React video elements.
 */
export const OPTIMIZED_VIDEO_PROPS = {
  preload: "metadata" as const,
  playsInline: true,
  controlsList: "nodownload" as const,
};
