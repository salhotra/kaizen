/**
 * Transcription Module - Routes
 *
 * HTTP route handlers for transcription endpoints (like NestJS controllers)
 */

import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
} from './transcription.constants.js';
import { transcribeAudio, validateConfiguration } from './transcription.service.js';
import type { TranscriptionError } from './transcription.types.js';

/**
 * Register transcription routes
 *
 * @param server - Fastify instance
 */
export async function registerTranscriptionRoutes(server: FastifyInstance): Promise<void> {
  // Register multipart support for this module
  await server.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: MAX_FILES_PER_REQUEST,
    },
  });

  /**
   * POST /api/transcribe
   *
   * Transcribe audio file to text using OpenAI Whisper
   *
   * Accepts multipart/form-data with:
   * - file: Audio file (required)
   * - language: ISO-639-1 language code (optional)
   * - prompt: Transcription prompt (optional)
   * - temperature: Sampling temperature 0-1 (optional, default: 0)
   */

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is temporary. When we expand this code, we will refactor
  server.post('/api/transcribe', async (request, reply) => {
    try {
      // Validate configuration on startup
      validateConfiguration();

      // Get multipart data
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file provided. Please upload an audio file.',
        });
      }

      // Validate file type (should be audio)
      if (!data.mimetype.startsWith('audio/')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: `Invalid file type: ${data.mimetype}. Only audio files are supported.`,
        });
      }

      // Convert stream to buffer
      const audioBuffer = await data.toBuffer();

      // Get optional parameters from fields
      const languageField = data.fields.language;
      const promptField = data.fields.prompt;
      const temperatureField = data.fields.temperature;

      const language =
        languageField && 'value' in languageField ? String(languageField.value) : undefined;
      const prompt = promptField && 'value' in promptField ? String(promptField.value) : undefined;
      const temperatureStr =
        temperatureField && 'value' in temperatureField
          ? String(temperatureField.value)
          : undefined;
      const temperature = temperatureStr ? Number.parseFloat(temperatureStr) : MIN_TEMPERATURE;

      // Validate temperature
      if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}.`,
        });
      }

      // Transcribe audio
      const text = await transcribeAudio({
        audioBuffer,
        filename: data.filename,
        mimetype: data.mimetype,
        language,
        prompt,
        temperature,
      });

      return reply.code(200).send({
        text,
        success: true,
      });
    } catch (error) {
      // Handle TranscriptionError
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TranscriptionError'
      ) {
        const transcriptionError = error as TranscriptionError;
        server.log.error({ err: transcriptionError }, 'Transcription error');

        return reply.code(transcriptionError.statusCode).send({
          error: 'Transcription Error',
          message: transcriptionError.message,
        });
      }

      // Handle multipart errors
      if (error instanceof Error && error.message.includes('File size limit')) {
        return reply.code(413).send({
          error: 'Payload Too Large',
          message: `Audio file is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
        });
      }

      // Generic error
      server.log.error({ err: error }, 'Unexpected error');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request.',
      });
    }
  });
}
