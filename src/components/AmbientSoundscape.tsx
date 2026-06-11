import { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, ListMusic, Check } from "lucide-react";

export interface TrackPreset {
  id: string;
  name: string;
  composer: string;
  vibe: string;
  vibeInfo: string;
  url: string;
}

export const MUSIC_PRESETS: TrackPreset[] = [
  {
    id: "chopin-nocturne",
    name: "Nocturne Op. 9 No. 2",
    composer: "Frédéric Chopin",
    vibe: "Doce e Romântica",
    vibeInfo: "Clássica melodia de amor 💕",
    url: "https://raw.githubusercontent.com/yishengc/Chopin/master/mp3/Nocturne-Op9-No2.mp3"
  },
  {
    id: "debussy-clair-de-lune",
    name: "Clair de Lune",
    composer: "Claude Debussy",
    vibe: "Poética e Aconchegante",
    vibeInfo: "Romance sob a luz do luar 🌙",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2a/Claude_Debussy_-_Suite_bergamasque_-_III._Clair_de_lune.ogg/Claude_Debussy_-_Suite_bergamasque_-_III._Clair_de_lune.ogg.mp3"
  },
  {
    id: "schumann-traumerei",
    name: "Träumerei",
    composer: "Robert Schumann",
    vibe: "Suave e Acolhedora",
    vibeInfo: "Devaneio doce e reconfortante ✨",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c8/Robert_Schumann_-_Kinderszenen%2C_Op._15_-_VII._Tr%C3%A4umerei.ogg/Robert_Schumann_-_Kinderszenen%2C_Op._15_-_VII._Tr%C3%A4umerei.ogg.mp3"
  },
  {
    id: "bach-prelude",
    name: "Prelúdio nº 1 em Dó Maior",
    composer: "Johann Sebastian Bach",
    vibe: "Serena e Calorosa",
    vibeInfo: "Harmonia pura e aconchegante 🌸",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e5/Bach_-_Prelude_1_in_C_Major_BWV_846.ogg/Bach_-_Prelude_1_in_C_Major_BWV_846.ogg.mp3"
  },
  {
    id: "ambient-synth",
    name: "Sintetizador de Ambiência (Offline)",
    composer: "Sintetizador Nativo",
    vibe: "Suave e Imersiva",
    vibeInfo: "Acordes aconchegantes sem streaming 🎹",
    url: "synth-only"
  }
];

const FIS4 = 369.99;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const CIS5 = 554.37;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const FIS5 = 739.99;

const satieMelody: { [step: number]: { freq: number; dur: number } } = {
  14: { freq: FIS4, dur: 5.5 }, // m5 b3
  20: { freq: G4, dur: 2.5 },   // m7 b3
  23: { freq: A4, dur: 2.5 },   // m8 b3
  26: { freq: B4, dur: 2.5 },   // m9 b3
  29: { freq: CIS5, dur: 2.5 }, // m10 b3
  32: { freq: D5, dur: 5.5 },   // m11 b3
  38: { freq: B4, dur: 2.5 },   // m13 b3
  41: { freq: CIS5, dur: 2.5 }, // m14 b3
  44: { freq: D5, dur: 2.5 },   // m15 b3
  47: { freq: A4, dur: 5.5 },   // m16 b3
  53: { freq: FIS4, dur: 5.5 }, // m18 b3
  59: { freq: G4, dur: 2.5 },   // m20 b3
  62: { freq: A4, dur: 2.5 },   // m21 b3
  65: { freq: B4, dur: 2.5 },   // m22 b3
  68: { freq: CIS5, dur: 2.5 }, // m23 b3
  71: { freq: D5, dur: 5.5 },   // m24 b3
  77: { freq: B4, dur: 2.5 },   // m26 b3
  80: { freq: CIS5, dur: 2.5 }, // m27 b3
  83: { freq: D5, dur: 2.5 },   // m28 b3
  86: { freq: A4, dur: 5.5 },   // m29 b3
};

interface AmbientSoundscapeProps {
  musicUrl?: string;
  key?: string;
}

// Hybrid Web Audio Synthesizer + HTML5 High-Fidelity Audio Streamer
export default function AmbientSoundscape({ musicUrl }: AmbientSoundscapeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45); // Comfortable default
  const [hasError, setHasError] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [useSyntheticPerformance, setUseSyntheticPerformance] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const failedUrlsRef = useRef<Set<string>>(new Set());
  const stepRef = useRef<number>(0);

  // Fallback tracklist updated, putting Chopin (Nocturne Op. 9 No. 2) as absolute default!
  const FALLBACK_MUSIC_URLS = MUSIC_PRESETS.map(p => p.url);

  const defaultMusicUrl = FALLBACK_MUSIC_URLS[0]; // Chopin Nocturne Op. 9 No. 2
  const rawMusicUrl = (musicUrl && musicUrl.trim()) ? musicUrl.trim() : defaultMusicUrl;
  // If the passed music url is the old Satie track, automatically fallback to Chopin Nocturne default as requested
  const finalMusicUrl = (rawMusicUrl.includes("Satie") || rawMusicUrl.includes("satie") || rawMusicUrl.includes("Gymnop"))
    ? defaultMusicUrl
    : rawMusicUrl;

  const isDirectAudioUrl = (url: string): boolean => {
    if (!url) return false;
    const cleanUrl = url.trim().toLowerCase();
    // Common direct audio file extensions
    if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/)) {
      return true;
    }
    // Check standard non-direct webpage formats (YouTube, Spotify, etc.)
    if (
      cleanUrl.includes("youtube.com") || 
      cleanUrl.includes("youtu.be") || 
      cleanUrl.includes("spotify.com") || 
      cleanUrl.includes("drive.google.com") ||
      cleanUrl.includes("soundcloud.com")
    ) {
      return false;
    }
    return true;
  };

  const isIndirect = musicUrl && musicUrl.trim() !== "" ? !isDirectAudioUrl(musicUrl) : false;
  const [currentMusicUrl, setCurrentMusicUrl] = useState(isIndirect ? defaultMusicUrl : finalMusicUrl);
  const [currentFallbackIdx, setCurrentFallbackIdx] = useState(() => {
    const idx = FALLBACK_MUSIC_URLS.indexOf(isIndirect ? defaultMusicUrl : finalMusicUrl);
    return idx !== -1 ? idx : 0;
  });

  const isCurrentlySynthesized = currentMusicUrl === "synth-only" || useSyntheticPerformance;

  // Sync currentMusicUrl, falling back if indirect URL is supplied
  useEffect(() => {
    if (isIndirect) {
      setCurrentMusicUrl(defaultMusicUrl);
      setCurrentFallbackIdx(0);
    } else {
      setCurrentMusicUrl(finalMusicUrl);
      const idx = FALLBACK_MUSIC_URLS.indexOf(finalMusicUrl);
      setCurrentFallbackIdx(idx !== -1 ? idx : 0);
    }
    setHasError(false);
  }, [finalMusicUrl, isIndirect]);

  const handleAudioError = (failingUrl?: string) => {
    if (!isPlaying) {
      return;
    }

    const currentFailing = failingUrl || currentMusicUrl;
    console.log(`[Soundscape Info] Stream error for: ${currentFailing}. Transitioning to custom live synthesizer.`);
    
    setUseSyntheticPerformance(true);
    setHasError(false);
    setIsPlaying(true);
    
    startSoundscape(currentFailing, true);
  };

  // Sync volume with audio element
  useEffect(() => {
    if (audioElRef.current && !isCurrentlySynthesized) {
      audioElRef.current.volume = volume;
    }
  }, [volume, isCurrentlySynthesized, currentMusicUrl]);

  // Sync music play active state when finalMusicUrl is edited in modal
  useEffect(() => {
    if (isPlaying) {
      setUseSyntheticPerformance(false);
      startSoundscape(finalMusicUrl);
    }
  }, [finalMusicUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSoundscape();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (err) {
        console.log("Web Audio Context not supported in this frame: ", err);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(err => console.log("Failed to resume AudioContext: ", err));
    }
  };

  const playWarmWoodBass = (frequency: number, duration: number, delayTime = 0.0) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const time = ctx.currentTime + delayTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.08 * (volume / 0.5), time + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      // Ignored
    }
  };

  const playAmbientChordNote = (frequency: number, duration: number, delayTime = 0.0) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const time = ctx.currentTime + delayTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.035 * (volume / 0.5), time + 0.6);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      // Ignored
    }
  };

  const playCrystallineMelody = (frequency: number, durationInBeats: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const time = ctx.currentTime;
      const duration = durationInBeats * 1.1;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(frequency * 2, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(450, time + duration);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.065 * (volume / 0.5), time + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc1.connect(filter);
      const sparkleGain = ctx.createGain();
      sparkleGain.gain.setValueAtTime(0.12, time);
      osc2.connect(sparkleGain);
      sparkleGain.connect(filter);

      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    } catch (e) {
      // Ignored
    }
  };

  // Celestial backing synth progression
  const progressions = [
    [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4 (Fmaj9)
    [220.00, 261.63, 329.63, 392.00, 493.88], // A3, C4, E4, G4, B4 (Am9)
    [261.63, 329.63, 392.00, 523.25, 587.33], // C4, E4, G4, C5, D5 (Cmaj9)
    [196.00, 246.94, 293.66, 392.00, 440.00], // G3, B3, D4, G4, A4 (G6)
  ];

  const startSoundscape = (overrideUrl?: string, forceSynth = false) => {
    const urlToPlay = overrideUrl || finalMusicUrl;
    const isSynth = urlToPlay === "synth-only" || forceSynth || useSyntheticPerformance;

    setHasError(false);
    initAudio();

    // 1. Play high-fidelity MP3 streaming audio (only if not synth-only)
    if (!isSynth) {
      if (audioElRef.current) {
        audioElRef.current.volume = volume;
        audioElRef.current.src = urlToPlay;
        const playPromise = audioElRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setHasError(false);
            })
            .catch((err) => {
              if (err.name === "AbortError") {
                // Expected when track is changed before loaded, ignore completely
                return;
              }
              // Normal browsers inside sandbox can block cross-origin content.
              // Fall back silently and elegantly to the synthesized instrumental of this track.
              console.log(`[Soundscape Info] HTML5 streaming unavailable for: ${urlToPlay}. Commencing dynamic live audio synthesis.`);
              
              setUseSyntheticPerformance(true);
              setHasError(false);
              setIsPlaying(true);

              if (audioElRef.current) {
                try {
                  audioElRef.current.pause();
                } catch (_) {}
              }

              // Fire up synthesized tracker instantly
              startSoundscape(urlToPlay, true);
            });
        } else {
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(true);
    }

    // 2. Start complementary backing/live play sequence
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    const activePreset = MUSIC_PRESETS.find(p => p.url === urlToPlay) || MUSIC_PRESETS[0];
    
    // Choose appropriate tempo / step spacing based on the selected song
    let beatDuration = 1.1; // Cozy slow tempo default (1.1s)
    if (activePreset.id === "chopin-nocturne") {
      beatDuration = 0.38; // Elegant romantic nocturne flowing beats
    } else if (activePreset.id === "debussy-clair-de-lune") {
      beatDuration = 0.55; // Gentle, peaceful impressionist flow
    } else if (activePreset.id === "schumann-traumerei") {
      beatDuration = 1.25; // Slow, dreamy lullaby tempo
    } else if (activePreset.id === "bach-prelude") {
      beatDuration = 0.32; // Smooth flowing Bach 16th-note texture
    }

    stepRef.current = 0;

    const playStep = () => {
      const step = stepRef.current;

      if (activePreset.id === "ambient-synth") {
        // --- AMBIENT SYNTH PIECE (GENTLE HARMONIC SWAY) ---
        const measureIndex = Math.floor(step / 3);
        const beat = step % 3;

        if (beat === 0) {
          const bassFreq = measureIndex % 2 === 0 ? 130.81 : 146.83; // C3 to D3
          playWarmWoodBass(bassFreq, 3.2);
        } else if (beat === 1) {
          const chordFreqs = measureIndex % 2 === 0
            ? [196.00, 246.94, 293.66, 392.00] // G3, B3, D4, G4 (G Major / C)
            : [174.61, 220.00, 261.63, 349.23]; // F3, A3, C4, F4 (F Major / D)
          
          chordFreqs.forEach((freq, idx) => {
            const noteDelay = idx * 0.08 + Math.random() * 0.02;
            playAmbientChordNote(freq, 2.5, noteDelay);
          });
        }

        stepRef.current = (stepRef.current + 1) % 36;

      } else if (activePreset.id === "debussy-clair-de-lune") {
        // --- Claude Debussy: Clair de Lune Dynamic Synthesis ---
        const beat = step % 6;
        const phrase = Math.floor(step / 6) % 4;

        if (beat === 0) {
          // Deep cozy bass support in Db Major
          const bassFreqs = [69.30, 82.41, 77.78, 69.30]; // Db2, E2, Eb2, Db2
          playWarmWoodBass(bassFreqs[phrase], 5.5);
        }

        if (beat === 2 || beat === 4) {
          const chordFreqs = [207.65, 277.18, 349.23]; // Ab3, Db4, F4
          chordFreqs.forEach((freq, idx) => {
            playAmbientChordNote(freq, 2.8, idx * 0.06);
          });
        }

        // Poetic, crystalline chime melody
        const clairMelody: { [key: number]: number } = {
          0: 554.37,  // Db5
          2: 523.25,  // C5
          3: 554.37,  // Db5
          6: 659.25,  // E5
          8: 587.33,  // D5
          10: 523.25, // C5
          12: 440.00, // A4
          14: 523.25, // C5
          16: 493.88, // B4
          20: 440.00, // A4
        };

        if (clairMelody[step]) {
          playCrystallineMelody(clairMelody[step], 3.5);
        }

        stepRef.current = (stepRef.current + 1) % 24;

      } else if (activePreset.id === "schumann-traumerei") {
        // --- Robert Schumann: Träumerei Romantic Lullaby ---
        const beat = step % 4;

        if (beat === 0) {
          const bassFreqs = [87.31, 116.54, 103.83, 87.31]; // F2, Bb2, G2, F2
          playWarmWoodBass(bassFreqs[Math.floor(step / 4) % 4], 4.5);
        }

        if (beat === 1) {
          const chordFreqs = [174.61, 220.00, 261.63]; // F3, A3, C4
          chordFreqs.forEach((freq, idx) => {
            playAmbientChordNote(freq, 3.2, idx * 0.05);
          });
        }

        // Nostalgic rising and falling warm baby-lullaby melody
        const traumereiMelody: { [key: number]: number } = {
          0: 349.23,  // F4
          1: 440.00,  // A4
          2: 523.25,  // C5
          3: 698.46,  // F5 (High peak)
          4: 659.25,  // E5
          6: 587.33,  // D5
          8: 523.25,  // C5
          10: 440.00, // A4
          12: 349.23, // F4
          14: 392.00, // G4
        };

        if (traumereiMelody[step]) {
          playCrystallineMelody(traumereiMelody[step], 2.8);
        }

        stepRef.current = (stepRef.current + 1) % 16;

      } else if (activePreset.id === "bach-prelude") {
        // --- Johann Sebastian Bach: Prelúdio em Dó Maior ---
        const measure = Math.floor(step / 16) % 4;
        const noteInMeasure = step % 8;

        let notes = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 659.25, 523.25]; // C Major arpeggio
        let bass = 130.81; // C3

        if (measure === 1) {
          // D Minor over C (Very rich transition)
          notes = [293.66, 349.23, 440.00, 587.33, 698.46, 587.33, 698.46, 587.33];
          bass = 116.54; // Bb2
        } else if (measure === 2) {
          // G Dominant 7th over B
          notes = [293.66, 392.00, 493.88, 587.33, 783.99, 587.33, 783.99, 587.33];
          bass = 123.47; // B2
        } else if (measure === 3) {
          // Back to sweet C Major
          notes = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 659.25, 523.25];
          bass = 130.81;
        }

        const freq = notes[noteInMeasure];
        
        // Soft pedal point bass note at the first beat of arpeggio repetition pair
        if (noteInMeasure === 0) {
          playWarmWoodBass(bass, 2.5);
        }

        playAmbientChordNote(freq, 1.2);

        stepRef.current = (stepRef.current + 1) % 64;

      } else if (activePreset.id === "chopin-nocturne") {
        // --- CHOPIN NOCTURNE OP. 9 NO. 2 ROMANTIC SYNTHESIZER ---
        const beat = step % 12;
        const measure = Math.floor(step / 12) % 4;

        // Rich left hand pedal bass at beat 0
        if (beat === 0) {
          let bassFreq = 77.78; // Eb2
          if (measure === 1) bassFreq = 103.83; // Ab2
          if (measure === 3) bassFreq = 116.54; // Bb2
          playWarmWoodBass(bassFreq, 4.0);
          playWarmWoodBass(bassFreq * 2, 4.0, 0.04);
        }

        // Warm accompaniment arpeggio chords at beat 4 and beat 8
        if (beat === 4 || beat === 8) {
          let chordFreqs = [196.00, 233.08, 311.13]; // G3, Bb3, Eb4
          if (measure === 1) chordFreqs = [207.65, 261.63, 311.13]; // Ab3, C4, Eb4
          if (measure === 3) chordFreqs = [174.61, 207.65, 293.66]; // F3, Ab3, D4

          chordFreqs.forEach((freq, idx) => {
            playAmbientChordNote(freq, 1.8, idx * 0.05);
          });
        }

        // Sweeping romantic melody notes
        const nocturneMelody: { [key: number]: number } = {
          0: 392.00,  // G4
          3: 392.00,  // G4
          5: 415.30,  // Ab4
          6: 392.00,  // G4
          8: 349.23,  // F4
          9: 311.13,  // Eb4
          11: 293.66, // D4
          12: 311.13, // Eb4
          15: 349.23, // F4
          18: 392.00, // G4
          21: 415.30, // Ab4
          24: 466.16, // Bb4
          27: 523.25, // C5
          30: 466.16, // Bb4
          33: 392.00, // G4
          36: 349.23, // F4
          39: 311.13, // Eb4
          42: 293.66, // D4
          45: 311.13, // Eb4
        };

        if (nocturneMelody[step]) {
          playCrystallineMelody(nocturneMelody[step], 1.8);
        }

        stepRef.current = (stepRef.current + 1) % 48;
      }
    };

    playStep();
    const interval = window.setInterval(playStep, beatDuration * 1000);
    intervalIdRef.current = interval;
  };

  const stopSoundscape = () => {
    // 1. Stop MP3 Stream
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch (e) {
        // Ignored
      }
    }
    // 2. Clear synth loop
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSoundscape = () => {
    if (isPlaying) {
      stopSoundscape();
    } else {
      failedUrlsRef.current.clear(); // Reset failure cache on manual trigger
      setUseSyntheticPerformance(false);
      startSoundscape();
      // Dispatch listener event
      window.dispatchEvent(new CustomEvent("ambient-audio-ready"));
    }
  };

  // Play crystalline bell chime when selecting milestones
  useEffect(() => {
    const handleTriggerChime = () => {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      try {
        const time = ctx.currentTime;
        const chimeFreqs = [523.25, 659.25, 783.99, 1046.50]; // Crystal bells (C5, E5, G5, C6)

        chimeFreqs.forEach((freq, i) => {
          const t = time + i * 0.08;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);

          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(0.04 * (volume / 0.5), t + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.9);
        });
      } catch (e) {
        // Silent catch for unsupported environments
      }
    };

    window.addEventListener("romantic-chime", handleTriggerChime);
    return () => {
      window.removeEventListener("romantic-chime", handleTriggerChime);
    };
  }, [isPlaying, volume]);

  const getActiveTrackLabel = () => {
    const matched = MUSIC_PRESETS.find(p => p.url === currentMusicUrl);
    return matched ? matched.name : "Trilha Personalizada";
  };

  const getActiveTrackVibe = () => {
    const matched = MUSIC_PRESETS.find(p => p.url === currentMusicUrl);
    return matched ? matched.vibe : "Música E Ambiência";
  };

  const handleSelectPreset = (url: string) => {
    failedUrlsRef.current.clear();
    setUseSyntheticPerformance(false);

    setCurrentMusicUrl(url);
    const idx = FALLBACK_MUSIC_URLS.indexOf(url);
    setCurrentFallbackIdx(idx !== -1 ? idx : 0);
    setShowPresets(false);
    setHasError(false);
    
    startSoundscape(url);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 portrait:bottom-5 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto z-50 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl sm:rounded-full shadow-xl border border-rose-100/60 transition-all duration-300">
      
      {/* Track preset selection menu */}
      {showPresets && (
        <div className="absolute bottom-full mb-3 right-0 left-0 sm:left-auto sm:w-[320px] bg-white rounded-2xl shadow-xl border border-rose-100/80 p-3.5 z-50 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-rose-50/60 mb-2">
            <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase tracking-wider">
              Escolher Trilha Sonora
            </span>
            <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
              Piano Clássico
            </span>
          </div>
          <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-1">
            {MUSIC_PRESETS.map((track) => {
              const isActive = currentMusicUrl === track.url;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectPreset(track.url)}
                  className={`flex flex-col text-left px-3 py-2 rounded-xl transition text-neutral-700 active:scale-98 ${
                    isActive 
                      ? "bg-rose-50/80 text-rose-600 border border-rose-100/50" 
                      : "hover:bg-neutral-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-tight">{track.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                  </div>
                  <span className="text-[10px] font-medium text-neutral-400 mt-0.5 leading-none">
                    Música por {track.composer}
                  </span>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-neutral-100/50 w-full text-[9px] text-neutral-500">
                    <span className="font-semibold text-rose-400">{track.vibe}</span>
                    <span className="text-[9px] text-neutral-400 italic max-w-[140px] truncate">{track.vibeInfo}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Invisible loop audio element */}
      {currentMusicUrl !== "synth-only" && !useSyntheticPerformance && (
        <audio
          ref={audioElRef}
          src={currentMusicUrl}
          loop
          preload="none"
          onError={handleAudioError}
        />
      )}

      <div className="flex items-center justify-between sm:justify-start gap-4">
        {/* Toggle Button with elegant size (meets >44px touch target) */}
        <button
          id="bg-music-toggle"
          onClick={toggleSoundscape}
          className={`flex items-center justify-center h-11 w-11 shrink-0 transition-all rounded-full bg-neutral-50 border border-neutral-100/60 active:scale-95 ${
            isPlaying
              ? "text-rose-500 bg-rose-50/50 border-rose-100/80 outline-none"
              : "text-neutral-400 hover:text-neutral-600 outline-none"
          }`}
          title={isPlaying ? "Silenciar música" : "Ativar música e ambiência"}
        >
          <div className="relative">
            {isPlaying ? (
              <>
                <Volume2 className="h-5.5 w-5.5 animate-[pulse_2s_infinite]" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              </>
            ) : (
              <VolumeX className="h-5.5 w-5.5 text-neutral-400" />
            )}
          </div>
        </button>

        {/* Text Area which is also beautifully styled & clickable for high touch area */}
        <button
          onClick={toggleSoundscape}
          className="flex-1 text-left select-none pr-1 focus:outline-none min-h-[44px] flex flex-col justify-center max-w-[140px] sm:max-w-[180px] overflow-hidden"
        >
          <span className="text-[9px] font-sans font-bold text-neutral-400 uppercase tracking-widest leading-none block truncate">
            {isPlaying ? getActiveTrackVibe() : "Música E Ambiência"}
          </span>
          <span className="text-[12px] font-sans font-semibold text-neutral-600 hover:text-rose-500 transition-colors mt-0.5 block truncate" title={getActiveTrackLabel()}>
            {isPlaying ? getActiveTrackLabel() : "Toque Para Ativar Som"}
          </span>
        </button>

        {/* Quick Playlist Selection Button */}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-all text-neutral-400 hover:text-rose-400 shrink-0 hover:bg-neutral-50 ${showPresets ? "text-rose-500 bg-rose-50/80" : ""}`}
          title="Alterar Trilha Sonora"
        >
          <ListMusic className="h-5.5 w-5.5" />
        </button>


      </div>

      {/* Gentle, poetic non-modal helper shown if mobile blocks audio autoplay */}
      {hasError && (
        <button
          onClick={() => {
            setHasError(false);
            startSoundscape();
          }}
          className="text-[10px] text-rose-500 font-sans text-center max-w-[280px] leading-tight px-1 py-1 border-t border-rose-50 mt-1 animate-pulse hover:text-rose-600 transition-colors w-full cursor-pointer font-medium"
        >
          Se o áudio estiver mudo, clique aqui para liberar e escutar a melodia! 🎵
        </button>
      )}

      {isIndirect && (
        <div className="text-[9px] text-amber-600 font-sans text-center max-w-[280px] leading-tight px-1 py-1 border-t border-amber-50 mt-1 font-medium">
          ⚠️ O link inserido não é de áudio direto (MP3). Ativamos Chopin clássico para manter a magia!
        </div>
      )}
    </div>
  );
}

// Global helper that any card/illustration can call on interaction
export function triggerStarChime() {
  window.dispatchEvent(new CustomEvent("romantic-chime"));
}
