/**
 * Get the AudioContext constructor for the current browser
 * Handles both standard AudioContext and webkit prefixed version
 *
 * @returns AudioContext constructor
 * @throws Error if AudioContext is not supported
 */
export function getAudioContextClass(): typeof AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is only available in browser environments');
  }

  if ('AudioContext' in window) {
    return window.AudioContext;
  }

  throw new Error('AudioContext is not supported in this browser');
}

/**
 * Check if AudioContext is supported in the current environment
 */
export function isAudioContextSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'AudioContext' in window;
}

