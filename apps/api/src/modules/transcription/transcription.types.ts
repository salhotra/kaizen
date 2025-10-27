/**
 * Transcription Module - Types
 *
 * DTOs and interfaces for the transcription domain
 */

/**
 * Options for transcribing audio
 */
export interface TranscriptionOptions {
  /**
   * The audio file buffer to transcribe
   */
  audioBuffer: Buffer;

  /**
   * The original filename (used to determine file type)
   */
  filename: string;

  /**
   * The MIME type of the audio file
   */
  mimetype: string;

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
 * Response from OpenAI Whisper API
 */
export interface WhisperApiResponse {
  text: string;
}

/**
 * Error response from OpenAI Whisper API
 */
export interface WhisperApiError {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

/**
 * Custom error class for transcription errors
 */
export class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}
