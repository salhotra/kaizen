import { env } from '../config/env';

export interface WhisperTranscriptionOptions {
  /**
   * The audio file to transcribe
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

export interface WhisperTranscriptionResponse {
  /**
   * The transcribed text
   */
  text: string;
}

export interface WhisperError {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

/**
 * Transcribe audio using OpenAI's Whisper API
 *
 * @param options - Transcription options
 * @returns Transcribed text
 * @throws Error if transcription fails
 */
export async function transcribeAudio(options: WhisperTranscriptionOptions): Promise<string> {
  const { audioBlob, language, prompt, temperature = 0 } = options;

  try {
    // Prepare form data
    const formData = new FormData();

    // Convert blob to file
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: audioBlob.type,
    });

    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    if (language) {
      formData.append('language', language);
    }

    if (prompt) {
      formData.append('prompt', prompt);
    }

    formData.append('temperature', temperature.toString());

    // Make API request
    const response = await fetch(`${env.openai.apiBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openai.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as WhisperError;
      throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = (await response.json()) as WhisperTranscriptionResponse;
    return data.text;
  } catch (error) {
    if (error instanceof Error) {
      // Network or API errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'Network error: Unable to reach Whisper API. Please check your internet connection.'
        );
      }
      throw error;
    }

    throw new Error('Unknown error occurred during transcription');
  }
}

/**
 * Check if the Whisper API is configured correctly
 *
 * @returns True if API key is present
 */
export function isWhisperConfigured(): boolean {
  try {
    return Boolean(env.openai.apiKey);
  } catch {
    return false;
  }
}
