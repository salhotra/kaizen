/**
 * API Types
 *
 * Type definitions for API requests and responses
 */

/**
 * Options for transcribing audio
 */
export interface TranscribeAudioOptions {
  /**
   * The audio blob to transcribe
   */
  audioBlob: Blob;

  /**
   * The language of the input audio (ISO-639-1 format)
   * If not specified, Whisper will auto-detect the language
   * @example 'en', 'es', 'fr'
   */
  language?: string;

  /**
   * Optional prompt to guide the model's transcription style
   * Can include specific vocabulary or formatting preferences
   */
  prompt?: string;

  /**
   * Temperature for sampling (0-1)
   * Higher values make output more random
   * @default 0
   */
  temperature?: number;
}

/**
 * Response from the transcription API
 */
export interface TranscriptionResponse {
  text: string;
  success: boolean;
}

/**
 * Error response from the API
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  timestamp: string;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorType?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
