export type GenerationStatus = 'uploaded' | 'generating' | 'completed' | 'failed'

export interface GenerationVersion {
  path: string
  url: string
  instruction: string | null
  createdAt: string
}

export interface Generation {
  id: string
  style: string | null
  aspectRatio: string
  status: GenerationStatus
  originalUrl: string | null
  resultUrl: string | null
  versions: GenerationVersion[]
  error: string | null
  createdAt: string
}

export interface GenerationUploadResponse {
  generation: Generation
  credits: number
}

export interface GenerationGenerateResponse {
  generation: Generation
  credits: number
}
