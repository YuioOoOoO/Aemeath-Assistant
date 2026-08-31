/**
 * Global audio manager for handling audio playback and interruption
 * This ensures all components share the same audio reference
 */
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentModel: any | null = null;
  private voicePerformanceGeneration = 0;
  private resolveVoicePerformance: (() => void) | null = null;
  private voicePerformanceComplete: Promise<void> = Promise.resolve();

  /**
   * Register the native motion belonging to the newest voice segment.
   * Starting a later segment supersedes the previous one, matching the
   * voice rule that a later performance may interrupt the current one.
   */
  beginVoicePerformance(): () => void {
    this.resolveVoicePerformance?.();

    const generation = ++this.voicePerformanceGeneration;
    this.voicePerformanceComplete = new Promise<void>((resolve) => {
      this.resolveVoicePerformance = resolve;
    });

    return () => {
      if (generation !== this.voicePerformanceGeneration) return;
      this.resolveVoicePerformance?.();
      this.resolveVoicePerformance = null;
    };
  }

  /** Wait for the final voice segment's model-authored motion to finish. */
  waitForVoicePerformance(): Promise<void> {
    return this.voicePerformanceComplete;
  }

  /** Mark the latest segment as having no native motion to wait for. */
  completeVoicePerformance(): void {
    this.resolveVoicePerformance?.();
    this.resolveVoicePerformance = null;
    this.voicePerformanceComplete = Promise.resolve();
  }

  /**
   * Set the current playing audio
   */
  setCurrentAudio(audio: HTMLAudioElement, model: any) {
    this.currentAudio = audio;
    this.currentModel = model;
  }

  /**
   * Stop current audio playback and lip sync
   */
  stopCurrentAudioAndLipSync() {
    if (this.currentAudio) {
      console.log('[AudioManager] Stopping current audio and lip sync');
      const audio = this.currentAudio;
      
      // Stop audio playback
      audio.pause();
      audio.src = '';
      audio.load();

      // Stop Live2D lip sync
      const model = this.currentModel;
      if (model) {
        model._voiceLipSyncReleasing = true;
        model.endVoiceInteraction?.();
      }
      if (model && model._wavFileHandler) {
        try {
          // Release PCM data to stop lip sync calculation in update()
          model._wavFileHandler.releasePcmData();
          console.log('[AudioManager] Called _wavFileHandler.releasePcmData()');

          // Additional reset of state variables as fallback
          model._wavFileHandler._lastRms = 0.0;
          model._wavFileHandler._sampleOffset = 0;
          model._wavFileHandler._userTimeSeconds = 0.0;
          console.log('[AudioManager] Also reset _lastRms, _sampleOffset, _userTimeSeconds as fallback');
        } catch (e) {
          console.error('[AudioManager] Error stopping/resetting wavFileHandler:', e);
        }
      } else if (model) {
        console.warn('[AudioManager] Current model does not have _wavFileHandler to stop/reset.');
      } else {
        console.log('[AudioManager] No associated model found to stop lip sync.');
      }

      // Clear references
      this.currentAudio = null;
      this.currentModel = null;

    } else {
      console.log('[AudioManager] No current audio playing to stop.');
    }

    // An explicit interruption must not leave conversation cleanup waiting
    // for a motion callback that Cubism may no longer emit. This also applies
    // after natural audio cleanup has already cleared currentAudio.
    this.completeVoicePerformance();
  }

  /**
   * Clear the current audio reference (called when audio ends naturally)
   */
  clearCurrentAudio(audio: HTMLAudioElement): boolean {
    if (this.currentAudio === audio) {
      this.currentAudio = null;
      this.currentModel = null;
      return true;
    }
    return false;
  }

  /**
   * Check if there's currently playing audio
   */
  hasCurrentAudio(): boolean {
    return this.currentAudio !== null;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
