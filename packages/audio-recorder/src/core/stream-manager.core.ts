import type { AudioConstraints } from '../types';
import { MediaStreamError } from '../types';

/**
 * Default audio constraints for high-quality recording
 */
const DEFAULT_AUDIO_CONSTRAINTS: AudioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 44100,
};

/**
 * Core class for managing MediaStream lifecycle
 * Handles microphone access, permissions, and cleanup
 *
 */
export class StreamManagerCore {
  private stream: MediaStream | null = null;

  /**
   * Check if MediaStream API is supported in the current environment
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices
    );
  }

  /**
   * Request microphone access and get MediaStream
   *
   * @param constraints - Audio constraints for the stream
   * @returns MediaStream instance
   * @throws MediaStreamError if access is denied or no microphone found
   */
  async getStream(constraints: AudioConstraints = {}): Promise<MediaStream> {
    if (!StreamManagerCore.isSupported()) {
      throw new MediaStreamError(
        'MediaStream API is not supported in this environment',
        'NOT_SUPPORTED'
      );
    }

    try {
      const finalConstraints = {
        ...DEFAULT_AUDIO_CONSTRAINTS,
        ...constraints,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: finalConstraints,
      });

      this.stream = mediaStream;
      return mediaStream;
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new MediaStreamError(
            'Microphone permission denied. Please allow microphone access and try again.',
            'NOT_ALLOWED'
          );
        }

        if (err.name === 'NotFoundError') {
          throw new MediaStreamError(
            'No microphone found. Please connect a microphone and try again.',
            'NOT_FOUND'
          );
        }
      }

      throw new MediaStreamError(
        `Failed to access microphone: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'UNKNOWN'
      );
    }
  }

  /**
   * Get the current active stream
   *
   * @returns Current MediaStream or null if not active
   */
  getActiveStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Stop all tracks in the current stream and release resources
   */
  stopStream(): void {
    if (!this.stream) {
      return;
    }

    const tracks = this.stream.getTracks();
    for (const track of tracks) {
      track.stop();
    }

    this.stream = null;
  }

  /**
   * Check if stream is currently active
   *
   * @returns true if stream exists and has active tracks
   */
  isActive(): boolean {
    if (!this.stream) {
      return false;
    }

    const tracks = this.stream.getTracks();
    return tracks.some((track) => track.readyState === 'live');
  }

  /**
   * Cleanup method - stops stream if active
   * Should be called when instance is no longer needed
   */
  cleanup(): void {
    this.stopStream();
  }
}
