/**
 * Media management helper for photos, videos, and smart client-side compression
 */

export interface ImageCompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxBytes?: number;
}

/**
 * Resizes and compresses an image Data URL using HTML5 Canvas to ensure optimal storage and network transfer.
 */
export async function compressDataUrl(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxDimension = 1200, quality = 0.78, maxBytes = 250000 } = options;

  if (typeof window === 'undefined') return dataUrl;
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  return new Promise((resolve) => {
    const img = new (window.Image || Image)();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width <= 0 || height <= 0) {
        resolve(dataUrl);
        return;
      }

      // Calculate new dimensions respecting aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Fill white background for transparent PNGs converted to JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/jpeg', quality);

      // If still exceeding maxBytes, do a quick secondary compression
      if (compressed.length > maxBytes * 1.33) {
        const lowerQuality = Math.max(0.5, quality - 0.2);
        const secondCanvas = document.createElement('canvas');
        const secondWidth = Math.round(width * 0.75);
        const secondHeight = Math.round(height * 0.75);
        secondCanvas.width = secondWidth;
        secondCanvas.height = secondHeight;
        const secondCtx = secondCanvas.getContext('2d');
        if (secondCtx) {
          secondCtx.fillStyle = '#FFFFFF';
          secondCtx.fillRect(0, 0, secondWidth, secondHeight);
          secondCtx.drawImage(img, 0, 0, secondWidth, secondHeight);
          compressed = secondCanvas.toDataURL('image/jpeg', lowerQuality);
        }
      }

      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Converts a File into a Data URL, automatically compressing and downscaling images to fit memory/cloud limits.
 */
export async function fileToDataUrl(
  file: File,
  options?: ImageCompressionOptions
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // If it is an image, automatically compress it
  if (file.type.startsWith('image/')) {
    return await compressDataUrl(rawDataUrl, options);
  }

  return rawDataUrl;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

