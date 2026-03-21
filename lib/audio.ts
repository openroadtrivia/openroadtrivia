// Audio engine for Open Road Trivia
// Uses MP3 sound effects (ElevenLabs) with Web Audio API fallback

let audioCtx: AudioContext | null = null;
let isMuted = false;
const sfxCache: Record<string, HTMLAudioElement> = {};

export function setAudioMuted(mute: boolean) { 
  isMuted = mute;
  if (mute) {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    // Stop any playing sound effects
    Object.values(sfxCache).forEach(a => { a.pause(); a.currentTime = 0; });
  }
}
export function getAudioMuted() { return isMuted; }

// Load and cache an MP3 sound effect
function playSfx(name: string, volume: number = 0.5) {
  if (isMuted) return;
  try {
    if (sfxCache[name]) {
      const a = sfxCache[name];
      a.currentTime = 0;
      a.volume = volume;
      a.play().catch(() => {});
      return;
    }
    const a = new Audio(`/audio/sfx/${name}.mp3`);
    a.volume = volume;
    a.onerror = () => { /* MP3 not found — fall back to synthetic */ playSynth(name); };
    sfxCache[name] = a;
    a.play().catch(() => playSynth(name));
  } catch (e) {
    playSynth(name);
  }
}

// Synthetic fallback (Web Audio API) — used when MP3s aren't available yet
function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

type Note = [number, number, number, number?];
function playNotes(notes: Note[]) {
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
  } catch (e) {}
}

function playSynth(name: string) {
  const synths: Record<string, Note[]> = {
    correct: [[523, 0.12, 0], [659, 0.12, 0.1], [784, 0.18, 0.2]],
    wrong: [[165, 0.25, 0], [156, 0.35, 0.15]],
    streak: [[523, 0.08, 0], [659, 0.08, 0.08], [784, 0.08, 0.16], [1047, 0.25, 0.24]],
    postcard: [[392, 0.12, 0], [494, 0.12, 0.12], [587, 0.12, 0.24], [784, 0.25, 0.36]],
    hazard: [[110, 0.2, 0, 0.2], [110, 0.2, 0.25, 0.2], [110, 0.35, 0.5, 0.2]],
    tick: [[880, 0.05, 0, 0.1]],
    timeup: [[392, 0.12, 0], [349, 0.12, 0.12], [330, 0.25, 0.24]],
    arrive: [[440, 0.1, 0, 0.12], [554, 0.1, 0.1, 0.12], [659, 0.15, 0.2, 0.12], [880, 0.25, 0.35, 0.15]],
    confetti: [[523, 0.08, 0], [659, 0.08, 0.06], [784, 0.08, 0.12], [1047, 0.08, 0.18], [1319, 0.3, 0.24]],
  };
  if (synths[name]) playNotes(synths[name]);
}

export const audio = {
  // Sound effects — tries MP3 first, falls back to synthetic
  correct: () => playSfx('correct', 0.6),
  wrong: () => playSfx('wrong', 0.5),
  streak: () => playSfx('streak', 0.7),
  postcard: () => playSfx('postcard', 0.6),
  hazard: () => playSfx('hazard', 0.6),
  tick: () => playSfx('tick', 0.3),
  timeUp: () => playSfx('timeup', 0.6),
  arrive: () => playSfx('arrive', 0.6),
  confetti: () => playSfx('confetti', 0.7),
  driving: () => playSfx('driving', 0.3),

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

  // Read question then call onEnd when done (for starting timer after voice)
  speakQuestionThen: (question: string, answers: string[], onEnd: () => void) => {
    if (isMuted) { onEnd(); return; }
    try {
      if (!window.speechSynthesis) { onEnd(); return; }
      window.speechSynthesis.cancel();
      const letters = ['A', 'B', 'C', 'D'];
      const full = question + ' ... ' + answers.map((a, i) => `${letters[i]}: ${a}`).join(' ... ');
      const utterance = new SpeechSynthesisUtterance(full);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      const pick = 
        enVoices.find(v => v.name.includes('Online') && v.name.includes('Natural')) ||
        enVoices.find(v => v.name.includes('Online')) ||
        enVoices.find(v => v.name.includes('Google') && v.lang === 'en-US') ||
        enVoices.find(v => v.name.includes('Samantha')) ||
        enVoices.find(v => v.lang === 'en-US') ||
        enVoices[0];
      if (pick) utterance.voice = pick;
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
      window.speechSynthesis.speak(utterance);
      // Fallback: if speech takes more than 20 seconds, start timer anyway
      setTimeout(() => { if (window.speechSynthesis?.speaking) return; onEnd(); }, 20000);
    } catch (e) {
      onEnd();
    }
  },

  // Stop speaking
  stopSpeaking: () => {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  },

  // Randomized result phrases — keeps the dopamine fresh
  // Only speaks every 3-10 correct answers so it feels natural, not robotic
  _correctCount: 0,
  _nextCorrectAt: Math.floor(Math.random() * 4) + 3, // first one triggers between 3-6
  _playerName: '' as string,

  setPlayerName: (name: string) => { audio._playerName = name; },

  speakCorrectResult: () => {
    const name = audio._playerName;
    const phrases = [
      "Nice! You nailed it.",
      "That's right!",
      "Exactly right.",
      "You got it!",
      "Spot on!",
      "Keep that streak going.",
      "Yes!",
      "Right on the money.",
      "Look at you go!",
      "Great instinct.",
      "You're on fire.",
      "Sharp. Very sharp.",
      "Nailed it.",
      "That's how it's done.",
      "Impressive.",
      "The Mother Road rewards the prepared.",
      "You clearly know your stuff.",
      "Rock solid.",
    ];
    const namedPhrases = name ? [
      `Nice one, ${name}!`,
      `${name}, you're on a roll!`,
      `Keep it up, ${name}.`,
      `${name} with the answer!`,
      `That's the way, ${name}.`,
      `${name} knows the road.`,
    ] : [];

    const allPhrases = [...phrases, ...namedPhrases];
    const pick = allPhrases[Math.floor(Math.random() * allPhrases.length)];
    setTimeout(() => audio.speak(pick), 400);
  },

  speakWrongResult: (correctAnswer: string) => {
    // Silent on wrong answers — just show the correct answer on screen
    // No voice rubbing it in
  },

  speakStreakResult: (streak: number) => {
    // Streaks always get called out — that's the dopamine hit
    const name = audio._playerName;
    const phrases = [
      `${streak} in a row!`,
      `That's ${streak} straight.`,
      `Hot streak! ${streak} in a row.`,
      `${streak} and counting.`,
    ];
    const namedPhrases = name ? [
      `${name} with ${streak} in a row!`,
      `${streak} straight, ${name}! Keep rolling.`,
    ] : [];
    const allPhrases = [...phrases, ...namedPhrases];
    const pick = allPhrases[Math.floor(Math.random() * allPhrases.length)];
    setTimeout(() => audio.speak(pick), 400);
  },
};
