/**
 * AudioManager — simple 8-bit sound effects via Web Audio API.
 */
class AudioManager {
    constructor() {
        this.ctx = null; // created on first user interaction
    }

    _ensure() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Play a simple tone.
     * @param {number} freq - Frequency in Hz
     * @param {number} duration - Seconds
     * @param {string} type - Oscillator type (square, triangle, sawtooth, sine)
     * @param {number} volume - 0–1
     */
    _tone(freq, duration, type = 'square', volume = 0.15) {
        this._ensure();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    /** Short rising chirp */
    jump() {
        this._ensure();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        osc.frequency.linearRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    /** Quick high ding */
    coin() {
        this._tone(988, 0.08, 'square', 0.1);
        setTimeout(() => this._tone(1319, 0.12, 'square', 0.1), 60);
    }

    /** Short low thud */
    stomp() {
        this._tone(200, 0.1, 'square', 0.15);
        setTimeout(() => this._tone(150, 0.08, 'square', 0.1), 50);
    }

    /** Rising power-up jingle */
    powerUp() {
        this._ensure();
        const now = this.ctx.currentTime;
        const notes = [262, 330, 392, 523];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const t = now + i * 0.1;
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        });
    }

    /** Descending "wah wah" */
    death() {
        this._ensure();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    }

    /** Short "bump" for head collision */
    bump() {
        this._tone(150, 0.08, 'triangle', 0.12);
    }

    /** Victory jingle */
    win() {
        this._ensure();
        const now = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const t = now + i * 0.15;
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
        });
    }
}
