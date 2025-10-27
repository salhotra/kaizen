/**
 * API Client
 *
 * Class-based HTTP client for communicating with the Kaizen API backend.
 */

import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { env } from '../config/env';
import {
  ApiError,
  type ApiErrorResponse,
  type HealthResponse,
  type TranscribeAudioOptions,
  type TranscriptionResponse,
} from './api.types';

/**
 * API Client class for Kaizen backend
 *
 * Provides a centralized, type-safe interface for all API interactions.
 * Handles authentication, error handling, and request/response transformations.
 */
export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = env.api.baseUrl) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor (can add auth tokens, logging, etc.)
    this.client.interceptors.request.use(
      (config) => {
        // Future: Add auth token here
        // config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || error.message;
          const statusCode = error.response.status;
          throw new ApiError(message, statusCode, error.response.data?.error);
        }

        if (error.code === 'ECONNABORTED') {
          // Request timeout
          throw new ApiError('Request timeout. Please try again.', 408);
        }

        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          // Network error
          throw new ApiError(
            'Network error: Unable to reach API. Please check your internet connection and ensure the API server is running.',
            503
          );
        }

        // Unknown error
        throw new ApiError(error.message || 'An unexpected error occurred', 500);
      }
    );
  }

  /**
   * Transcribe audio to text using Whisper API
   *
   * @param options - Transcription options
   * @returns Transcribed text
   * @throws ApiError if transcription fails
   */
  async transcribeAudio(options: TranscribeAudioOptions): Promise<string> {
    const { audioBlob, language, prompt, temperature } = options;

    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new ApiError('Audio blob is empty', 400);
    }

    // Prepare form data
    const formData = new FormData();

    // Convert blob to file with .webm extension
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: audioBlob.type,
    });

    formData.append('file', audioFile);

    // Add optional parameters
    if (language) {
      formData.append('language', language);
    }

    if (prompt) {
      formData.append('prompt', prompt);
    }

    if (temperature !== undefined) {
      formData.append('temperature', temperature.toString());
    }

    const response = await this.client.post<TranscriptionResponse>('/api/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.text) {
      throw new ApiError('No transcription text received from API', 500);
    }

    return response.data.text;
  }

  /**
   * Check API health status
   *
   * @returns True if API is healthy and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.status === 200 && response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get the underlying Axios instance for advanced usage
   *
   * @returns Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

/**
 * Default API client instance
 * Use this singleton for most cases
 */
export const apiClient = new ApiClient();
