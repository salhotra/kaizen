/**
 * RVC Voice Conversion Service
 *
 * Provides voice conversion capabilities using the local RVC service.
 * Supports pitch shifting and gender voice conversion.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VoiceConversionOptions {
  /** Pitch shift in semitones (-24 to +24) */
  pitch?: number;
  /** Target gender for automatic pitch calculation */
  targetGender?: 'male' | 'female';
  /** Source gender for automatic pitch calculation */
  sourceGender?: 'male' | 'female';
  /** Custom model path (optional) */
  modelPath?: string;
  /** Pitch extraction method */
  f0Method?: 'rmvpe' | 'crepe' | 'harvest' | 'fcpe';
}

export class VoiceConversionService {
  private readonly RVC_PATH = '/Users/nishantsalhotra/Desktop/dev/RVC';
  private readonly PYTHON_PATH = `${this.RVC_PATH}/.venv/bin/python`;
  private readonly CONVERT_SCRIPT = `${this.RVC_PATH}/convert_voice.py`;
  private readonly DEFAULT_MODEL = `${this.RVC_PATH}/assets/pretrained_v2/f0G40k.pth`;

  /**
   * Check if RVC service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`${this.PYTHON_PATH} --version`);
      return stdout.includes('Python 3.10');
    } catch {
      return false;
    }
  }

  /**
   * Convert voice with pitch/gender changes
   *
   * @param inputPath - Path to input audio file
   * @param outputPath - Path to output audio file
   * @param options - Conversion options
   * @returns Path to converted audio file
   */
  async convertVoice(
    inputPath: string,
    outputPath: string,
    options: VoiceConversionOptions = {}
  ): Promise<string> {
    // Calculate pitch if gender conversion is requested
    let pitch = options.pitch ?? 0;
    if (options.sourceGender && options.targetGender) {
      pitch = this.calculatePitchForGenderChange(options.sourceGender, options.targetGender);
    }

    const modelPath = options.modelPath ?? this.DEFAULT_MODEL;
    const f0Method = options.f0Method ?? 'rmvpe';

    // Build command
    const command = [
      this.PYTHON_PATH,
      this.CONVERT_SCRIPT,
      `"${inputPath}"`,
      `"${outputPath}"`,
      pitch.toString(),
      '--model',
      `"${modelPath}"`,
      '--method',
      f0Method,
    ].join(' ');

    console.log(`🎙️  Converting voice with RVC...`);
    console.log(`   Input: ${inputPath}`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Pitch: ${pitch > 0 ? '+' : ''}${pitch} semitones`);

    try {
      // Set environment variables for M2 optimization
      const env = {
        ...process.env,
        PYTORCH_ENABLE_MPS_FALLBACK: '1',
        PYTORCH_MPS_HIGH_WATERMARK_RATIO: '0.0',
      };

      const { stdout, stderr } = await execAsync(command, {
        env,
        cwd: this.RVC_PATH,
      });

      if (stderr && !stderr.includes('UserWarning')) {
        console.error('RVC stderr:', stderr);
      }

      console.log(stdout);
      console.log('✅ Voice conversion complete');

      return outputPath;
    } catch (error) {
      console.error('❌ Voice conversion failed:', error);
      throw new Error(
        `Voice conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate pitch shift for gender change
   *
   * @param from - Source gender
   * @param to - Target gender
   * @returns Pitch shift in semitones
   */
  private calculatePitchForGenderChange(from: 'male' | 'female', to: 'male' | 'female'): number {
    if (from === to) return 0;

    // Male to Female: raise pitch by 12-18 semitones (use 15 as default)
    // Female to Male: lower pitch by 12-18 semitones (use -15 as default)
    return from === 'male' && to === 'female' ? 15 : -15;
  }

  /**
   * Quick gender conversion helper
   *
   * @param inputPath - Input audio file
   * @param outputPath - Output audio file
   * @param targetGender - Target gender
   * @returns Path to converted audio
   */
  async convertGender(
    inputPath: string,
    outputPath: string,
    targetGender: 'male' | 'female'
  ): Promise<string> {
    // Assume opposite gender as source for simplicity
    const sourceGender = targetGender === 'male' ? 'female' : 'male';

    return this.convertVoice(inputPath, outputPath, {
      sourceGender,
      targetGender,
    });
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`ls -1 ${this.RVC_PATH}/assets/pretrained_v2/*.pth`);
      return stdout.trim().split('\n');
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const voiceConversionService = new VoiceConversionService();

/**
 * Example usage:
 *
 * import { voiceConversionService } from './services/voice-conversion.service';
 *
 * // Check if RVC is available
 * const isAvailable = await voiceConversionService.isAvailable();
 *
 * // Convert male voice to female
 * await voiceConversionService.convertGender(
 *   'input-male.wav',
 *   'output-female.wav',
 *   'female'
 * );
 *
 * // Custom pitch shift
 * await voiceConversionService.convertVoice(
 *   'input.wav',
 *   'output.wav',
 *   { pitch: +12 }
 * );
 */
