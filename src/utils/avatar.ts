// Clean Instagram-style monochrome user silhouette avatar (SVG data URI)
export const DEFAULT_USER_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" fill="#18181b"/>
      <circle cx="64" cy="46" r="22" fill="#ffffff"/>
      <path d="M22 118c4-24 22-38 42-38s38 14 42 38H22z" fill="#ffffff"/>
    </svg>`
  );

// Helper to resolve user/creator avatar — falls back to DEFAULT_USER_AVATAR when empty or Dicebear placeholder
export function getAvatarUrl(avatar?: string | null): string {
  if (!avatar || !avatar.trim()) return DEFAULT_USER_AVATAR;
  if (avatar.includes('api.dicebear.com')) return DEFAULT_USER_AVATAR;
  return avatar;
}

// Helper to convert an uploaded image File into a compressed Data URL
export function readImageFileAsDataUrl(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
