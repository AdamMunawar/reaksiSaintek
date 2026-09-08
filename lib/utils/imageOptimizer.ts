/**
 * Client-Side Image Optimizer for LPM Reaksi Portal
 *
 * Mengompresi dan mengonversi gambar secara instan di browser sebelum diunggah ke server.
 * Sangat hemat resource server / hosting:
 * - Mengurangi ukuran file 80%–98% (contoh: 5MB -> ~60KB WebP)
 * - Mencegah lonjakan RAM/CPU di server hosting
 * - Mempercepat waktu upload dan load halaman bagi pembaca
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.8)
  targetFormat?: 'image/webp' | 'image/jpeg';
}

export interface OptimizedResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // percentage saved (e.g. 92.5)
  width: number;
  height: number;
}

export async function optimizeImageInBrowser(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizedResult> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.8,
    targetFormat = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala proporsional (aspect ratio preserved)
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Render ke Canvas HTML5
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Gagal menginisialisasi canvas context'));
          return;
        }

        // Quality render settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert ke WebP / Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi gambar'));
              return;
            }

            const cleanBaseName = file.name
              .replace(/\.[^/.]+$/, '')
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '-');

            const ext = targetFormat === 'image/webp' ? 'webp' : 'jpg';
            const optimizedFilename = `${cleanBaseName}_reaksi.${ext}`;

            const optimizedFile = new File([blob], optimizedFilename, {
              type: targetFormat,
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL(targetFormat, quality);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savedPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: optimizedFile,
              dataUrl,
              originalSize,
              compressedSize,
              compressionRatio: savedPercentage,
              width,
              height,
            });
          },
          targetFormat,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat gambar untuk dioptimasi'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar'));
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
