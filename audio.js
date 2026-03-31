// audio.js - Retro Web Audio Synthesizer

var AudioSystem = new function() {
  this.ctx = null;
  this.muted = false;
  this.masterGain = null;

  this.init = function() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; // Browser does not support Web Audio API
    
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5; // default volume
    this.masterGain.connect(this.ctx.destination);
  };

  this.toggleMute = function() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime);
    }
    return this.muted;
  };

  this.playShoot = function() {
    if (!this.ctx || this.muted) return;
    
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.type = 'square';
    // Frequency drop for a classic "pew"
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);
  };

  this.playExplosion = function() {
    if (!this.ctx || this.muted) return;

    // Create a 0.5-second buffer for white noise bursts
    var bufferSize = this.ctx.sampleRate * 0.5;
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    
    for (var i = 0; i < bufferSize; i++) {
        // Random noise between -1 and 1
        data[i] = Math.random() * 2 - 1;
    }
    
    var noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter to muffle noise into a "boom" or crunch
    var filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);
    
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.5);
  };

  this.playLifeLost = function() {
    if (!this.ctx || this.muted) return;
    
    // Descending failure tones
    this._playTone(300, 0.4, 0);
    this._playTone(200, 0.6, 0.2);
    this._playTone(150, 0.8, 0.4);
  };

  this._playTone = function(freq, dur, delay) {
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    osc.frequency.linearRampToValueAtTime(freq - 50, this.ctx.currentTime + delay + dur);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + delay + dur);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + dur);
  };
};
