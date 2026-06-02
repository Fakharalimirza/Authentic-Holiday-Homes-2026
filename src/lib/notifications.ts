/**
 * Unified Notification Sound & Audio Alerts System
 * Powered by Web Audio API - synthesized perfectly inside the browser sandbox!
 * No physical mp3 dependencies required, extremely stable across devices.
 */

class AudioNotificationService {
  private audioCtx: AudioContext | null = null;

  private initContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (browser security constraints)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Triple Bubble Drop Synthesized Pitch for Direct Messaging Events
   */
  public playDMChime() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Note 1: High bubble pop
      this.playTone(ctx, 880, 0.12, now, 0.08);
      // Note 2: Step up chime
      this.playTone(ctx, 1100, 0.15, now + 0.08, 0.05);
      // Note 3: Warm resolution tone
      this.playTone(ctx, 1318.51, 0.35, now + 0.16, 0.12);
    } catch (error) {
      console.warn("Failed to reproduce synthesized DM sound effect:", error);
    }
  }

  /**
   * Smooth, attention grabbing dual-chime for newly lodged/updated tickets
   */
  public playTicketAlert() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // First pleasant chord component
      this.playTone(ctx, 587.33, 0.2, now, 0.15); // D5
      this.playTone(ctx, 783.99, 0.25, now + 0.1, 0.15); // G5
      // Sweet second interval
      this.playTone(ctx, 987.77, 0.45, now + 0.2, 0.25); // B5
    } catch (error) {
      console.warn("Failed to reproduce ticket notification melody:", error);
    }
  }

  private playTone(
    ctx: AudioContext, 
    frequency: number, 
    duration: number, 
    startTime: number, 
    decay: number
  ) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    
    // Smooth attack and pleasant envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + decay);
  }
}

export const notificationService = new AudioNotificationService();
