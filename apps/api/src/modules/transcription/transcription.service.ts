/**
 * Transcription Module - Service
 *
 * Business logic for audio transcription using OpenAI's Whisper API with Axios
 */

import axios, { type AxiosError } from 'axios';
import FormData from 'form-data';
import { env } from '../../config/env.js';
import {
  DEFAULT_TEMPERATURE,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  WHISPER_API_TIMEOUT_MS,
  WHISPER_MODEL,
} from './transcription.constants.js';
import {
  TranscriptionError as TranscriptionErrorClass,
  type TranscriptionOptions,
  type WhisperApiError,
  type WhisperApiResponse,
} from './transcription.types.js';

/**
 * Axios instance configured for OpenAI Whisper API
 */
const whisperClient = axios.create({
  baseURL: env.OPENAI_API_BASE_URL,
  timeout: WHISPER_API_TIMEOUT_MS,
  headers: {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
  },
});

/**
 * Response interceptor for Whisper API error handling
 */
whisperClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<WhisperApiError>) => {
    if (error.response) {
      const message = error.response.data?.error?.message || error.message;
      const statusCode = error.response.status;
      throw new TranscriptionErrorClass(`OpenAI API error: ${message}`, statusCode);
    }

    if (error.code === 'ECONNABORTED') {
      throw new TranscriptionErrorClass('Request timeout. The transcription took too long.', 408);
    }

    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new TranscriptionErrorClass(
        'Network error: Unable to reach OpenAI API. Please check your internet connection.',
        503,
        error
      );
    }

    throw new TranscriptionErrorClass(`Transcription failed: ${error.message}`, 500, error);
  }
);

/**
 * Transcribe audio using OpenAI's Whisper API
 *
 * @param options - Transcription options
 * @returns Transcribed text
 * @throws TranscriptionError if transcription fails
 */
export async function transcribeAudio(options: TranscriptionOptions): Promise<string> {
  const {
    audioBuffer,
    filename,
    mimetype,
    language,
    prompt,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  // Validate audio buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new TranscriptionErrorClass('Audio buffer is empty', 400);
  }

  // Validate file size
  if (audioBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new TranscriptionErrorClass(
      `Audio file too large: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
      413
    );
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename,
    contentType: mimetype,
  });
  formData.append('model', WHISPER_MODEL);

  if (language) {
    formData.append('language', language);
  }

  if (prompt) {
    formData.append('prompt', prompt);
  }

  formData.append('temperature', temperature.toString());

  const response = await whisperClient.post<WhisperApiResponse>('/audio/transcriptions', formData, {
    headers: {
      ...formData.getHeaders(),
    },
  });

  if (!response.data.text) {
    throw new TranscriptionErrorClass('No transcription text received from API', 500);
  }

  return response.data.text;
}

/**
 * Validate that the OpenAI API is configured correctly
 *
 * @throws TranscriptionError if configuration is invalid
 */
export function validateConfiguration(): void {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '') {
    throw new TranscriptionErrorClass(
      'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
      500
    );
  }
}
