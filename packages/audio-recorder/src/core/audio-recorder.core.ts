import { AudioRecordingError, RecordingState } from '../types';

/**
 * Supported audio MIME types
 */
export enum AudioMimeType {
  WEBM = 'audio/webm',
  MP4 = 'audio/mp4',
  OGG = 'audio/ogg',
}

/**
 * Default MIME type for recording
 */
export const DEFAULT_MIME_TYPE = AudioMimeType.WEBM;

/**
 * Options for AudioRecorderCore
 */
export interface AudioRecorderCoreOptions {
  /**
   * MIME type for the recording
   * @default 'audio/webm'
   */
  mimeType?: string;
}

/**
 * Event callbacks for AudioRecorderCore
 */
export interface AudioRecorderCoreEvents {
  onStateChange?: (state: RecordingState) => void;
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onStop?: (blob: Blob) => void;
}

/**
 * Core class for audio recording using MediaRecorder API
 * Handles the low-level MediaRecorder interactions
 */
export class AudioRecorderCore {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private state: RecordingState = RecordingState.Idle;
  private events: AudioRecorderCoreEvents = {};

  constructor(private options: AudioRecorderCoreOptions = {}) {}

  /**
   * Check if MediaRecorder is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'MediaRecorder' in window;
  }

  /**
   * Get the best supported MIME type
   *
   * @param preferredType - Preferred MIME type to try first
   * @returns Supported MIME type or null if none found
   */
  static getSupportedMimeType(preferredType?: string | AudioMimeType): string | null {
    if (!AudioRecorderCore.isSupported()) {
      return null;
    }

    const typesToTry = [
      preferredType || DEFAULT_MIME_TYPE,
      AudioMimeType.WEBM,
      AudioMimeType.MP4,
      AudioMimeType.OGG,
    ];

    for (const type of typesToTry) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Register event callbacks
   *
   * @param events - Event callbacks object
   */
  on(events: AudioRecorderCoreEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Start recording from the provided MediaStream
   *
   * @param stream - MediaStream to record from
   * @throws AudioRecordingError if MediaRecorder is not supported
   */
  async start(stream: MediaStream): Promise<void> {
    if (!AudioRecorderCore.isSupported()) {
      const error = new AudioRecordingError(
        'MediaRecorder API is not supported in this browser',
        'NOT_SUPPORTED'
      );
      this.events.onError?.(error);
      throw error;
    }

    try {
      const mimeType =
        AudioRecorderCore.getSupportedMimeType(this.options.mimeType) ||
        DEFAULT_MIME_TYPE;

      if (!mimeType) {
        throw new AudioRecordingError('No supported audio MIME type found', 'NOT_SUPPORTED');
      }

      // Create MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      this.setState(RecordingState.Recording);

      // Set up event listeners
      this.mediaRecorder.addEventListener('dataavailable', this.handleDataAvailable);
      this.mediaRecorder.addEventListener('stop', this.handleStop);
      this.mediaRecorder.addEventListener('error', this.handleError);

      // Start recording
      this.mediaRecorder.start();
    } catch (err) {
      const error = new AudioRecordingError(
        `Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'RECORDING_FAILED'
      );
      this.setState(RecordingState.Idle);
      this.events.onError?.(error);
      throw error;
    }
  }

  /**
   * Stop recording and return the audio blob
   *
   * @returns Promise that resolves with the audio blob
   */
  async stop(): Promise<Blob> {
    if (!this.mediaRecorder || this.state !== 'recording') {
      return new Blob([], { type: DEFAULT_MIME_TYPE });
    }

    return new Promise((resolve) => {
      const handleFinalStop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || DEFAULT_MIME_TYPE,
        });

        this.mediaRecorder?.removeEventListener('stop', handleFinalStop);
        resolve(audioBlob);
      };

      this.setState(RecordingState.Processing);
      this.mediaRecorder?.addEventListener('stop', handleFinalStop);
      this.mediaRecorder?.stop();
    });
  }

  /**
   * Cleanup resources
   * Should be called when instance is no longer needed
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.removeEventListener('dataavailable', this.handleDataAvailable);
      this.mediaRecorder.removeEventListener('stop', this.handleStop);
      this.mediaRecorder.removeEventListener('error', this.handleError);

      if (this.state === 'recording') {
        this.mediaRecorder.stop();
      }

      this.mediaRecorder = null;
    }

    this.audioChunks = [];
    this.setState(RecordingState.Idle);
  }

  /**
   * Handle data available event
   */
  private handleDataAvailable = (event: BlobEvent): void => {
    if (event.data.size > 0) {
      this.audioChunks.push(event.data);
      this.events.onDataAvailable?.(event.data);
    }
  };

  /**
   * Handle stop event
   */
  private handleStop = (): void => {
    const audioBlob = new Blob(this.audioChunks, {
      type: this.mediaRecorder?.mimeType || DEFAULT_MIME_TYPE,
    });

    this.setState(RecordingState.Idle);

    if (audioBlob.size > 0) {
      this.events.onStop?.(audioBlob);
    }
  };

  /**
   * Handle error event
   */
  private handleError = (event: Event): void => {
    console.error('MediaRecorder error:', event);
    const error = new AudioRecordingError('Recording failed. Please try again.', 'RECORDING_FAILED');
    this.setState(RecordingState.Idle);
    this.events.onError?.(error);
  };

  /**
   * Update state and notify listeners
   */
  private setState(newState: RecordingState): void {
    this.state = newState;
    this.events.onStateChange?.(newState);
  }
}

