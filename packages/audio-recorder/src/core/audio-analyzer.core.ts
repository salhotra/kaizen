import { getAudioContextClass, isAudioContextSupported } from './audio-context.utils';

/**
 * Audio metrics extracted from analysis
 */
export interface AudioMetrics {
  /**
   * Duration of the audio in milliseconds
   */
  duration: number;

  /**
   * Average volume level (0-255)
   */
  averageVolume: number;
}

/**
 * Core class for analyzing audio data using Web Audio API
 * Framework-agnostic, can be used outside React
 *
 * Handles low-level audio decoding and metric extraction
 */
export class AudioAnalyzerCore {
  /**
   * Check if Web Audio API is supported
   */
  static isSupported(): boolean {
    return isAudioContextSupported();
  }

  /**
   * Decode audio blob and extract technical metrics
   * Pure technical operation - extracts duration and volume data
   *
   * @param audioBlob - The audio blob to analyze
   * @returns Promise with audio metrics (duration and volume)
   * @throws Error if Web Audio API is not supported or decoding fails
   */
  static async analyzeBlob(audioBlob: Blob): Promise<AudioMetrics> {
    if (!AudioAnalyzerCore.isSupported()) {
      throw new Error('Web Audio API is not supported in this environment');
    }

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Create audio context
      const AudioContextClass = getAudioContextClass();
      const audioContext = new AudioContextClass();

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get duration in milliseconds
      const duration = audioBuffer.duration * 1000;

      // Calculate average volume from first channel
      const channelData = audioBuffer.getChannelData(0);
      let sum = 0;

      for (let i = 0; i < channelData.length; i++) {
        const value = channelData[i];
        if (value !== undefined) {
          sum += Math.abs(value);
        }
      }

      const averageAmplitude = sum / channelData.length;
      // Normalize to 0-255 range (typical audio analysis range)
      const averageVolume = Math.min(255, averageAmplitude * 255 * 10);

      // Close audio context to free resources
      await audioContext.close();

      return {
        duration,
        averageVolume,
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze audio blob: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get peak volume from audio blob
   * Useful for detecting if audio contains any sound at all
   *
   * @param audioBlob - The audio blob to analyze
   * @returns Promise with peak volume (0-255)
   */
  static async getPeakVolume(audioBlob: Blob): Promise<number> {
    if (!AudioAnalyzerCore.isSupported()) {
      throw new Error('Web Audio API is not supported in this environment');
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();

      const AudioContextClass = getAudioContextClass();
      const audioContext = new AudioContextClass();

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        const value = Math.abs(channelData[i] ?? 0);
        if (value > peak) {
          peak = value;
        }
      }

      await audioContext.close();

      // Normalize to 0-255 range
      return Math.min(255, peak * 255);
    } catch (error) {
      throw new Error(
        `Failed to get peak volume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

