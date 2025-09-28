/**
 * Logo optimization utilities for better performance
 */

export interface OptimizedLogo {
  dataUrl: string;
  width: number;
  height: number;
  size: number; // in bytes
  format: string;
}

/**
 * Compress and resize logo image for optimal performance
 */
export async function optimizeLogo(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<OptimizedLogo> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to optimized data URL
        const format = getOptimalFormat(file.type);
        const dataUrl = canvas.toDataURL(format, quality);

        // Calculate size
        const size = Math.round((dataUrl.length * 3) / 4); // Approximate base64 size

        resolve({
          dataUrl,
          width,
          height,
          size,
          format
        });
      } catch {
        reject(new Error('Failed to optimize image'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if image is too large
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Get optimal image format for compression
 */
function getOptimalFormat(originalType: string): string {
  // Prefer WebP for better compression, fallback to JPEG
  if (originalType === 'image/png' && supportsWebP()) {
    return 'image/webp';
  }
  
  // Use JPEG for photos, PNG for graphics with transparency
  if (originalType === 'image/png') {
    return 'image/png';
  }
  
  return 'image/jpeg';
}

/**
 * Check if browser supports WebP
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Validate logo file
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Logo file must be smaller than 5MB.' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file.' };
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.' };
  }

  return { valid: true };
}

/**
 * Create a lazy-loaded image component
 */
export function createLazyImage(
  src: string,
  alt: string,
  className: string = '',
  placeholder: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
): HTMLImageElement {
  const img = new Image();
  img.alt = alt;
  img.className = className;
  img.src = placeholder;
  
  // Lazy load the actual image
  img.onload = () => {
    img.src = src;
  };
  
  img.onerror = () => {
    // Fallback to placeholder if image fails to load
    img.src = placeholder;
  };
  
  return img;
}

/**
 * Get logo dimensions from data URL
 */
export function getLogoDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}
