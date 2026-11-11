/**
 * Cloudflare R2 Media Upload Service
 * Automatically uploads images (covers, manga chapter scans, avatars) to Cloudflare R2
 * via `/api/r2/upload` when deployed on Cloudflare, with seamless compressed fallback.
 */
import { readImageFileAsDataUrl } from '../utils/avatar';

export async function uploadImageToR2(
  file: File,
  folder: 'covers' | 'chapters' | 'avatars' | 'reviews' = 'covers',
  maxWidth = 1600,
  quality = 0.88
): Promise<string> {
  // First read/optimize image into a clean Data URL
  const dataUrl = await readImageFileAsDataUrl(file, maxWidth, quality);

  try {
    const res = await fetch('/api/r2/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name || `${folder}_${Date.now()}.jpg`,
        contentType: file.type || 'image/jpeg',
        folder,
        dataUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.url) {
        return data.url as string;
      }
    }
  } catch {
    // If running in local browser mode without R2 bucket bound yet, fall back to compressed Data URL
  }

  return dataUrl;
}
