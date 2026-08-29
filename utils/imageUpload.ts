export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

const EXT_BY_TYPE: Record<AllowedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

export function extensionForImageType(type: AllowedImageType) {
  return EXT_BY_TYPE[type]
}

export function validateImageFile(file: { type: string; size: number }) {
  if (!isAllowedImageType(file.type)) {
    return 'Use a JPEG, PNG, or WebP image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 8 MB or smaller.'
  }
  return null
}
