// Audio engine for Open Road Trivia
// Uses Web Audio API directly - no dependencies

let audioCtx: AudioContext | null = null;
let isMuted = false; // Start with sound ON

export function setAudioMuted(mute: boolean) { 
  isMuted = mute;
  if (mute) {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }
}
export function getAudioMuted() { return isMuted; }

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

type Note = [number, number, number, number?]; // [freq, duration, delay, volume?]

function play(notes: Note[]) {
  if (isMuted) return;
  try {
    const ctx = getCtx();
    notes.forEach(([freq, dur, delay, vol = 0.15]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      const t1 = t0 + dur;
      osc.start(t0);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.linearRampToValueAtTime(0.001, t1);
      osc.stop(t1 + 0.01);
    });
  } catch (e) {
    // Audio not available - fail silently
  }
}

export const audio = {
  correct: () => play([[523, 0.12, 0], [659, 0.12, 0.1], [784, 0.18, 0.2]]),
  wrong: () => play([[165, 0.25, 0], [156, 0.35, 0.15]]),
  streak: () => play([[523, 0.08, 0], [659, 0.08, 0.08], [784, 0.08, 0.16], [1047, 0.25, 0.24]]),
  postcard: () => play([[392, 0.12, 0], [494, 0.12, 0.12], [587, 0.12, 0.24], [784, 0.25, 0.36]]),
  hazard: () => play([[110, 0.2, 0, 0.2], [110, 0.2, 0.25, 0.2], [110, 0.35, 0.5, 0.2]]),
  tick: () => play([[880, 0.05, 0, 0.1]]),
  timeUp: () => play([[392, 0.12, 0], [349, 0.12, 0.12], [330, 0.25, 0.24]]),
  // Driving engine hum — low rumble for 2.5 seconds
  driving: () => {
    if (isMuted) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 65;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.04, t0 + 0.3);
      gain.gain.setValueAtTime(0.04, t0 + 2.0);
      gain.gain.linearRampToValueAtTime(0, t0 + 2.8);
      osc.start(t0);
      osc.stop(t0 + 3);
    } catch (e) {}
  },
  // Arrival chime — you made it to the next city
  arrive: () => play([[440, 0.1, 0, 0.12], [554, 0.1, 0.1, 0.12], [659, 0.15, 0.2, 0.12], [880, 0.25, 0.35, 0.15]]),
  init: () => { try { getCtx(); } catch (e) {} },

  // Text-to-speech — reads question and answers aloud
  speak: (text: string) => {
    if (isMuted) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Pick the best available voice, in priority order:
      // 1. Windows "Online" neural voices (Windows 10/11)
      // 2. Google voices (Chrome on any platform)
      // 3. Apple "Premium" or "Enhanced" voices (Mac/iOS)
      // 4. Any voice with "Natural" in the name
      // 5. Any en-US voice
      // 6. Any English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      
      const pick = 
        enVoices.find(v => v.name.includes('Online') && v.name.includes('Natural')) ||
        enVoices.find(v => v.name.includes('Online')) ||
        enVoices.find(v => v.name.includes('Google') && v.lang === 'en-US') ||
        enVoices.find(v => v.name.includes('Samantha')) ||  // Mac default, good quality
        enVoices.find(v => v.name.includes('Premium')) ||
        enVoices.find(v => v.name.includes('Enhanced')) ||
        enVoices.find(v => v.name.includes('Natural')) ||
        enVoices.find(v => v.name.includes('Jenny')) ||     // Windows 11 neural
        enVoices.find(v => v.name.includes('Aria')) ||      // Windows 11 neural
        enVoices.find(v => v.name.includes('Guy')) ||       // Windows 11 neural
        enVoices.find(v => v.lang === 'en-US') ||
        enVoices[0];
      
      if (pick) utterance.voice = pick;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // TTS not available - fail silently
    }
  },

  // Read a full question: question text then answer choices
  speakQuestion: (question: string, answers: string[]) => {
    if (isMuted) return;
    const letters = ['A', 'B', 'C', 'D'];
    const full = question + ' ... ' + answers.map((a, i) => `${letters[i]}: ${a}`).join(' ... ');
    audio.speak(full);
  },

  // Stop speaking
  stopSpeaking: () => {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  },
};
