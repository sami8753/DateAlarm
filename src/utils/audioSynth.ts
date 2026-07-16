/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;
let currentIntervalId: any = null;
let currentNodes: AudioNode[] = [];
let isPlayingLoop = false;
let currentLoopToneId: string | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopActiveSound(): void {
  // Stop loop timers
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
    currentIntervalId = null;
  }
  isPlayingLoop = false;
  currentLoopToneId = null;

  // Stop and disconnect all active audio nodes
  currentNodes.forEach((node) => {
    try {
      if ((node as any).stop) {
        (node as any).stop();
      }
      node.disconnect();
    } catch (e) {
      // Ignore errors if already stopped or disconnected
    }
  });
  currentNodes = [];

  // Stop device vibration
  if (navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (e) {
      // Ignore vibration error
    }
  }
}

// Helper to schedule vibration sequence
function runVibration(enabled: boolean) {
  if (enabled && navigator.vibrate) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800, 200, 400]);
    } catch (e) {
      // Ignore
    }
  }
}

// Heavy 1. Emergency Siren
function playEmergencySiren(ctx: AudioContext, time: number, duration: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, time);
  
  // High energy frequency sweeps up and down
  osc.frequency.linearRampToValueAtTime(1300, time + 0.4);
  osc.frequency.linearRampToValueAtTime(500, time + 0.8);
  osc.frequency.linearRampToValueAtTime(1300, time + 1.2);
  osc.frequency.linearRampToValueAtTime(500, time + 1.6);
  osc.frequency.linearRampToValueAtTime(1300, time + 2.0);
  osc.frequency.linearRampToValueAtTime(600, time + duration);

  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.4, time + 0.05);
  gainNode.gain.linearRampToValueAtTime(0.4, time + duration - 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3200, time);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + duration);

  currentNodes.push(osc, filter, gainNode);
}

// Heavy 2. Industrial Claxon / Warning Buzzer
function playIndustrialClaxon(ctx: AudioContext, time: number, duration: number) {
  const freqs = [95, 142, 190, 285]; // detuned low buzz harmonics
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, time);
  
  // Rapid on/off pulse (beep-beep claxon)
  const pulseSpeed = 0.45;
  const numPulses = Math.floor(duration / pulseSpeed);

  for (let i = 0; i < numPulses; i++) {
    const pulseStart = time + i * pulseSpeed;
    const pulseEnd = pulseStart + 0.32;
    if (pulseEnd > time + duration) break;

    mainGain.gain.setValueAtTime(0, pulseStart);
    mainGain.gain.linearRampToValueAtTime(0.45, pulseStart + 0.02);
    mainGain.gain.setValueAtTime(0.45, pulseEnd - 0.02);
    mainGain.gain.linearRampToValueAtTime(0, pulseEnd);
  }

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(idx * 6 - 9, time);

    osc.connect(mainGain);
    osc.start(time);
    osc.stop(time + duration);
    currentNodes.push(osc);
  });

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(450, time);
  filter.Q.setValueAtTime(3.0, time);

  mainGain.connect(filter);
  filter.connect(ctx.destination);
  currentNodes.push(mainGain, filter);
}

// Heavy 3. Cyber Frenzy / Techno Pulse
function playCyberFrenzy(ctx: AudioContext, time: number, duration: number) {
  const steps = [1400, 700, 1100, 550, 1300, 800, 1000, 600];
  const stepDur = 0.075; // extremely rapid
  const repetitions = Math.floor(duration / (steps.length * stepDur));

  let index = 0;
  for (let r = 0; r < repetitions; r++) {
    for (let s = 0; s < steps.length; s++) {
      const noteTime = time + index * stepDur;
      if (noteTime + stepDur > time + duration) break;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(steps[s], noteTime);

      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.3, noteTime + 0.005);
      gainNode.gain.linearRampToValueAtTime(0, noteTime + stepDur - 0.005);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + stepDur);

      currentNodes.push(osc, gainNode);
      index++;
    }
  }
}

// Heavy 4. Radioactive Alert / Pulsar
function playRadioactiveAlert(ctx: AudioContext, time: number, duration: number) {
  const pulseDur = 0.5;
  const numPulses = Math.floor(duration / pulseDur);

  for (let i = 0; i < numPulses; i++) {
    const pulseStart = time + i * pulseDur;
    if (pulseStart + pulseDur > time + duration) break;

    // Sub-bass rumble / thud
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(60, pulseStart);
    
    subGain.gain.setValueAtTime(0, pulseStart);
    subGain.gain.linearRampToValueAtTime(0.55, pulseStart + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.001, pulseStart + 0.38);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(160, pulseStart);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(pulseStart);
    subOsc.stop(pulseStart + pulseDur);
    currentNodes.push(subOsc, subFilter, subGain);

    // High warning alert screech (every other beat)
    if (i % 2 === 0) {
      const highOsc = ctx.createOscillator();
      const highGain = ctx.createGain();
      highOsc.type = 'square';
      highOsc.frequency.setValueAtTime(2300, pulseStart + 0.04);

      highGain.gain.setValueAtTime(0, pulseStart + 0.04);
      highGain.gain.linearRampToValueAtTime(0.25, pulseStart + 0.07);
      highGain.gain.exponentialRampToValueAtTime(0.001, pulseStart + 0.32);

      highOsc.connect(highGain);
      highGain.connect(ctx.destination);

      highOsc.start(pulseStart + 0.04);
      highOsc.stop(pulseStart + pulseDur);
      currentNodes.push(highOsc, highGain);
    }
  }
}

// 1. Zen Chime
function playZenChime(ctx: AudioContext, time: number, duration: number) {
  const freqs = [329.63, 493.88, 659.25, 987.77]; // E4, B4, E5, B5
  const volumes = [0.4, 0.25, 0.15, 0.1];

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volumes[index], time + 0.05);
    // Exponential decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);

    currentNodes.push(osc, gainNode);
  });
}

// 2. Digital Beeps
function playDigitalBeep(ctx: AudioContext, time: number, duration: number) {
  const beepDur = 0.15;
  const gap = 0.08;
  const numBeeps = Math.floor(duration / (beepDur + gap));

  for (let i = 0; i < numBeeps; i++) {
    const beepTime = time + i * (beepDur + gap);
    if (beepTime + beepDur > time + duration) break;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, beepTime); // High crisp beep

    gainNode.gain.setValueAtTime(0, beepTime);
    gainNode.gain.setValueAtTime(0.15, beepTime + 0.01);
    gainNode.gain.setValueAtTime(0.15, beepTime + beepDur - 0.01);
    gainNode.gain.setValueAtTime(0.001, beepTime + beepDur);

    // Filter to make it less harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, beepTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(beepTime);
    osc.stop(beepTime + beepDur);

    currentNodes.push(osc, gainNode, filter);
  }
}

// 3. Uplifting Marimba
function playUpliftingMarimba(ctx: AudioContext, time: number, duration: number) {
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25]; // C5, E5, G5, C6, G5, E5
  const step = 0.12; // Arpeggio step
  const noteDur = 0.3;
  const repetitions = Math.max(1, Math.floor(duration / (notes.length * step)));

  let index = 0;
  for (let r = 0; r < repetitions; r++) {
    for (let n = 0; n < notes.length; n++) {
      const noteTime = time + index * step;
      if (noteTime + noteDur > time + duration) break;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Combine sine and triangle for wooden mallet marimba sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[n], noteTime);

      const oscOver = ctx.createOscillator();
      oscOver.type = 'sine';
      oscOver.frequency.setValueAtTime(notes[n] * 2, noteTime); // 1st harmonic for brightness

      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.25, noteTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur);

      osc.connect(gainNode);
      oscOver.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      oscOver.start(noteTime);
      osc.stop(noteTime + noteDur);
      oscOver.stop(noteTime + noteDur);

      currentNodes.push(osc, oscOver, gainNode);
      index++;
    }
  }
}

// 4. Cosmic Echo
function playCosmicEcho(ctx: AudioContext, time: number, duration: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(110, time); // A2 drone

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(220, time); // A3 secondary

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, time);
  // Sweet sweep
  filter.frequency.exponentialRampToValueAtTime(2200, time + duration / 2);
  filter.frequency.exponentialRampToValueAtTime(150, time + duration);
  filter.Q.setValueAtTime(6, time);

  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.2, time + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);

  currentNodes.push(osc1, osc2, filter, gainNode);
}

// 5. Sunrise Melody
function playSunriseMelody(ctx: AudioContext, time: number, duration: number) {
  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5 pentatonic
  const noteDur = 0.8;
  const gap = 0.4;
  const numNotes = Math.floor(duration / gap);

  for (let i = 0; i < numNotes; i++) {
    const noteTime = time + i * gap;
    if (noteTime + noteDur > time + duration) break;

    const freq = scale[i % scale.length];
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    // Gentle fade in and out
    gainNode.gain.setValueAtTime(0, noteTime);
    gainNode.gain.linearRampToValueAtTime(0.3, noteTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + noteDur);

    currentNodes.push(osc, gainNode);
  }
}

// 6. Classic Bell
function playClassicBell(ctx: AudioContext, time: number, duration: number) {
  const fundamental = 440; // A4
  // Detuned bells
  const frequencies = [fundamental, fundamental * 1.5, fundamental * 2, fundamental * 2.5, fundamental * 3.12];
  const decays = [1.0, 0.8, 0.6, 0.4, 0.2];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.15 * decays[idx], time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration * decays[idx]);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);

    currentNodes.push(osc, gainNode);
  });
}

// 7. Pulsing Synth
function playPulsingSynth(ctx: AudioContext, time: number, duration: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130.81, time); // C3 bass note

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(100, time);

  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.35, time + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

  // Pulse modulation (LFO) on filter frequency
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(4, time); // 4Hz speed
  lfoGain.gain.setValueAtTime(500, time); // sweep up to 500Hz

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(time);
  lfo.start(time);
  osc.stop(time + duration);
  lfo.stop(time + duration);

  currentNodes.push(osc, lfo, lfoGain, filter, gainNode);
}

// Master Tone Router
function triggerTone(ctx: AudioContext, toneId: string, time: number, duration: number) {
  switch (toneId) {
    case 'emergency_siren':
      playEmergencySiren(ctx, time, duration);
      break;
    case 'industrial_claxon':
      playIndustrialClaxon(ctx, time, duration);
      break;
    case 'cyber_frenzy':
      playCyberFrenzy(ctx, time, duration);
      break;
    case 'radioactive_alert':
      playRadioactiveAlert(ctx, time, duration);
      break;
    case 'zen_chime':
      playZenChime(ctx, time, duration);
      break;
    case 'digital_beep':
      playDigitalBeep(ctx, time, duration);
      break;
    case 'uplifting_marimba':
      playUpliftingMarimba(ctx, time, duration);
      break;
    case 'cosmic_echo':
      playCosmicEcho(ctx, time, duration);
      break;
    case 'sunrise_melody':
      playSunriseMelody(ctx, time, duration);
      break;
    case 'classic_bell':
      playClassicBell(ctx, time, duration);
      break;
    case 'pulsing_synth':
      playPulsingSynth(ctx, time, duration);
      break;
    default:
      playZenChime(ctx, time, duration);
  }
}

/**
 * Play a specific tone as a one-shot preview (e.g., in the settings page).
 */
export function playTonePreview(toneId: string, duration = 2.0, vibration = false): void {
  try {
    stopActiveSound();
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    triggerTone(ctx, toneId, now, duration);
    runVibration(vibration);
  } catch (e) {
    console.error('Failed to play tone preview:', e);
  }
}

/**
 * Play an alarm tone continuously in a loop until stopActiveSound is called.
 */
export function startAlarmLoop(toneId: string, vibration = false): void {
  try {
    if (isPlayingLoop && currentLoopToneId === toneId) {
      return; // Already playing this tone loop
    }
    stopActiveSound();

    isPlayingLoop = true;
    currentLoopToneId = toneId;
    const ctx = getAudioContext();

    const loopInterval = 3000; // Trigger sound every 3 seconds
    const playOnce = () => {
      if (!isPlayingLoop) return;
      const now = ctx.currentTime;
      triggerTone(ctx, toneId, now, 2.5);
      runVibration(vibration);
    };

    // First trigger immediately
    playOnce();

    // Setup repeating triggers
    currentIntervalId = setInterval(playOnce, loopInterval);
  } catch (e) {
    console.error('Failed to start alarm sound loop:', e);
  }
}
