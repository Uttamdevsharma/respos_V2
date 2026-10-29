// Notification sound synthesizer using the Web Audio API.
// Avoids needing static MP3 files and potential 404/loading errors.

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Play a chime sound (usually for new orders)
  playChime() {
    this.init();
    if (!this.ctx) return;

    // Resume context if suspended (browser security autoplays)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // Chime utilizes two fast ascending notes
    this.playTone(523.25, 0.15, t); // C5
    this.playTone(659.25, 0.35, t + 0.08); // E5
  }

  // Play a success/settlement notification sound (usually for payment completion)
  playSuccess() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    this.playTone(523.25, 0.1, t); // C5
    this.playTone(659.25, 0.1, t + 0.07); // E5
    this.playTone(783.99, 0.3, t + 0.14); // G5
  }

  // Play a status update beep (alert)
  playBeep() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.playTone(440, 0.2, this.ctx.currentTime); // A4
  }

  private playTone(freq: number, duration: number, startTime: number) {
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Volume envelope to prevent popping/clicks
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }
}

export const playSound = new SoundManager();
