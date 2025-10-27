/**
 * Transcription Module
 *
 * Public API for the transcription domain
 */

export { registerTranscriptionRoutes } from './transcription.routes.js';
export { transcribeAudio, validateConfiguration } from './transcription.service.js';
export type { TranscriptionOptions } from './transcription.types.js';
export { TranscriptionError } from './transcription.types.js';
