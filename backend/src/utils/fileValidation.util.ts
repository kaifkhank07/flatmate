export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/gif',
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export const isValidImageMimeType = (mimetype: string): boolean => {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimetype.toLowerCase());
};

export const isValidVideoMimeType = (mimetype: string): boolean => {
  return ALLOWED_VIDEO_MIME_TYPES.includes(mimetype.toLowerCase());
};

export const sanitizeFileName = (originalName: string): string => {
  return originalName
    .toLowerCase()
    .trim()
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-');
};
