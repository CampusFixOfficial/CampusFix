// =============================================================
// CampusFix - Client-Side Image Compressor Utility
// =============================================================
// Uses native HTML5 Canvas and Browser APIs to resize and compress
// image files before upload to reduce payload size to <= 500KB.
// Zero external dependencies required.
// Owner: Pranjal Singh (Student Portal)
// =============================================================

const DEFAULT_OPTIONS = {
  maxDimension: 1600, // Maximum width or height in pixels
  targetSizeBytes: 500 * 1024, // 500 KB target
  initialQuality: 0.82, // High initial visual fidelity
  minQuality: 0.45, // Lower bound to avoid severe artifacts
  qualityStep: 0.1,
};

/**
 * Format bytes into a human-readable string (e.g., "342 KB").
 * 
 * @param {number} bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Convert a File or Blob into a Base64 data URL for previewing or payload attachment.
 * 
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<string>} Base64 data URL
 */
export const fileToDataUrl = (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) {
      return reject(new Error('No file provided to fileToDataUrl'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
};

/**
 * Calculate scaled dimensions while preserving aspect ratio.
 * 
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {number} maxDimension - Upper bound for width or height
 * @returns {{ width: number, height: number }}
 */
const calculateDimensions = (width, height, maxDimension) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    const scale = maxDimension / width;
    return {
      width: Math.round(maxDimension),
      height: Math.round(height * scale),
    };
  } else {
    const scale = maxDimension / height;
    return {
      width: Math.round(width * scale),
      height: Math.round(maxDimension),
    };
  }
};

/**
 * Convert an HTML5 Canvas content to a Blob with specific MIME type and quality.
 * 
 * @param {HTMLCanvasElement} canvas
 * @param {string} mimeType
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
const canvasToBlob = (canvas, mimeType, quality) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      mimeType,
      quality
    );
  });
};

/**
 * Load an image source into an HTMLImageElement safely.
 * 
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file: ' + (err.message || 'unknown error')));
    };

    img.src = objectUrl;
  });
};

/**
 * Compress and resize a single image file using HTML5 Canvas.
 * 
 * Target size is approximately 500KB or less while maintaining high clarity.
 * Handles JPEG, PNG, and WebP.
 * Gracefully falls back to the original file if compression cannot be performed.
 * 
 * @param {File} file - Original user-selected file
 * @param {Object} [customOptions] - Optional configuration overrides
 * @returns {Promise<File>} Compressed File instance
 */
export const compressImage = async (file, customOptions = {}) => {
  // Safety checks
  if (!file || !(file instanceof File)) {
    return file;
  }

  // If not an image or in a non-browser environment, return as-is
  if (!file.type || !file.type.startsWith('image/') || typeof window === 'undefined') {
    return file;
  }

  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  try {
    // If the file is already small (e.g. <= 250KB) and likely has reasonable dimensions,
    // we can still verify its dimensions or return early
    const img = await loadImage(file);
    const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, options.maxDimension);

    // If image is already smaller than target and requires no downscaling, return original
    if (file.size <= options.targetSizeBytes && width === img.naturalWidth && height === img.naturalHeight) {
      return file;
    }

    // Prepare offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('Canvas 2D context unavailable, returning original file');
      return file;
    }

    // Determine output format
    // WebP supports alpha transparency and lossy compression.
    // PNG is lossless and cannot be quality-compressed via canvas without converting.
    let outputType = file.type;
    let isPng = file.type === 'image/png';

    // If original is PNG and larger than target size, converting to image/webp provides
    // massive compression while preserving transparent backgrounds.
    if (isPng && file.size > options.targetSizeBytes) {
      outputType = 'image/webp';
    } else if (file.type === 'image/jpg' || file.type === 'image/jpeg') {
      outputType = 'image/jpeg';
      // Fill canvas background with white for JPEGs to avoid black transparent areas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Iterative quality reduction to achieve target size
    let quality = options.initialQuality;
    let bestBlob = null;

    while (quality >= options.minQuality) {
      const blob = await canvasToBlob(canvas, outputType, quality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      // If under target size, we found an optimal balance
      if (blob.size <= options.targetSizeBytes) {
        bestBlob = blob;
        break;
      }

      quality -= options.qualityStep;
    }

    // If PNG couldn't be reduced enough as WebP/PNG, try JPEG as last resort if acceptable
    if (bestBlob && bestBlob.size > options.targetSizeBytes && outputType !== 'image/jpeg') {
      const jpegCanvas = document.createElement('canvas');
      jpegCanvas.width = width;
      jpegCanvas.height = height;
      const jpegCtx = jpegCanvas.getContext('2d');
      if (jpegCtx) {
        jpegCtx.fillStyle = '#ffffff';
        jpegCtx.fillRect(0, 0, width, height);
        jpegCtx.drawImage(img, 0, 0, width, height);
        const jpegBlob = await canvasToBlob(jpegCanvas, 'image/jpeg', 0.75);
        if (jpegBlob.size < bestBlob.size) {
          bestBlob = jpegBlob;
          outputType = 'image/jpeg';
        }
      }
    }

    if (!bestBlob) {
      return file;
    }

    // Retain clean original name with appropriate extension
    let outputName = file.name;
    if (outputType === 'image/webp' && !outputName.toLowerCase().endsWith('.webp')) {
      outputName = outputName.replace(/\.[^.]+$/, '') + '.webp';
    } else if (outputType === 'image/jpeg' && !outputName.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      outputName = outputName.replace(/\.[^.]+$/, '') + '.jpg';
    }

    // Construct a standard File object
    const compressedFile = new File([bestBlob], outputName, {
      type: outputType,
      lastModified: Date.now(),
    });

    // Return the smaller of original vs compressed
    return compressedFile.size < file.size ? compressedFile : file;

  } catch (error) {
    console.warn('Image compression encountered an error; falling back to original file:', error);
    return file;
  }
};

/**
 * Compress an array of files concurrently.
 * 
 * @param {FileList|File[]} files
 * @param {Object} [options]
 * @returns {Promise<File[]>}
 */
export const compressImages = async (files, options = {}) => {
  if (!files || files.length === 0) return [];
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map((file) => compressImage(file, options)));
};

export default {
  compressImage,
  compressImages,
  fileToDataUrl,
  formatFileSize,
};
