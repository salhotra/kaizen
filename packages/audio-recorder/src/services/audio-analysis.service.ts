import { AudioAnalyzerCore } from '../core';
import type { AudioAnalysisResult, AudioValidationConfig } from '../types';

/**
 * Analyzes audio blob to determine if it contains meaningful speech
 * Checks both duration and average volume levels
 *
 * This is a SERVICE - it applies BUSINESS RULES for validation
 * Technical audio analysis is handled by AudioAnalyzerCore
 *
 * @param audioBlob - The audio blob to analyze
 * @param config - Validation configuration
 * @returns Analysis result with validity status
 */
export async function analyzeAudioBlob(
  audioBlob: Blob,
  config: AudioValidationConfig = {}
): Promise<AudioAnalysisResult> {
  const { minDuration = 5000, minVolumeThreshold = 10 } = config;

  try {
    // Use core layer to extract technical metrics
    const { duration, averageVolume } = await AudioAnalyzerCore.analyzeBlob(audioBlob);

    // Apply BUSINESS RULES - validation logic for your application
    
    // Business rule: Recording must meet minimum duration
    if (duration < minDuration) {
      return {
        isValid: false,
        duration,
        averageVolume,
        invalidationReason: `Recording too short (${(duration / 1000).toFixed(1)}s < ${minDuration / 1000}s)`,
      };
    }

    // Business rule: Recording must have sufficient volume
    if (averageVolume < minVolumeThreshold) {
      return {
        isValid: false,
        duration,
        averageVolume,
        invalidationReason: `Volume too low (${averageVolume.toFixed(1)} < ${minVolumeThreshold})`,
      };
    }

    // Valid recording
    return {
      isValid: true,
      duration,
      averageVolume,
    };
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw new Error(
      `Failed to analyze audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Quick check to determine if audio blob should be transcribed
 * Returns true if audio meets minimum requirements
 *
 * @param audioBlob - The audio blob to check
 * @param config - Validation configuration
 * @returns True if audio should be transcribed
 */
export async function shouldTranscribeAudio(
  audioBlob: Blob,
  config?: AudioValidationConfig
): Promise<boolean> {
  const result = await analyzeAudioBlob(audioBlob, config);
  return result.isValid;
}

