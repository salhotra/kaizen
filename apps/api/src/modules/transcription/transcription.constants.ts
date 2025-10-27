/**
 * Transcription Module - Constants
 *
 * Centralized constants for the transcription domain
 */

/**
 * File size limits
 */
export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 25MB (OpenAI Whisper API limit)

/**
 * Multipart upload limits
 */
export const MAX_FILES_PER_REQUEST = 1;

/**
 * OpenAI Whisper API configuration
 */
export const WHISPER_MODEL = 'whisper-1';
export const WHISPER_API_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Temperature configuration
 */
export const MIN_TEMPERATURE = 0;
export const MAX_TEMPERATURE = 1;
export const DEFAULT_TEMPERATURE = 0;
