export type GenerationStatus = 'uploaded' | 'generating' | 'completed' | 'failed'

export interface Generation {
  id: string
  style: string | null
  aspectRatio: string
  status: GenerationStatus
  originalUrl: string | null
  resultUrl: string | null
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
