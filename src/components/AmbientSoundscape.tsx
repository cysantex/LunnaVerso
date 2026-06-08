import { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, Sparkles } from "lucide-react";

// Web Audio synthesizer for the ultimate sensorial romantic portal
export default function AmbientSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  // Stop sound when unmounted
  useEffect(() => {
    return () => {
      stopSoundscape();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playRomanticNote = (frequency: number, duration: number, delayTime = 0.0) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const time = ctx.currentTime + delayTime;

    // Create oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Soft triangle wave for physical warm flute/lullaby tone
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, time);

    // Warm filter to reduce high frequencies
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, time);

    // Soft ADSR envelope
    gainNode.gain.setValueAtTime(0, time);
    // Slow attack (0.5s) to make it wash in gently
    gainNode.gain.linearRampToValueAtTime(0.12, time + 0.8);
    // Smooth decay/release
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Connecting nodes
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  };

  // Chord progression generator: Fmaj9 -> Am9 -> Cmaj9 -> G6 (sensorial harmony)
  const progressions = [
    [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4 (Fmaj9)
    [220.00, 261.63, 329.63, 392.00, 493.88], // A3, C4, E4, G4, B4 (Am9)
    [261.63, 329.63, 392.00, 523.25, 587.33], // C4, E4, G4, C5, D5 (Cmaj9)
    [196.00, 246.94, 293.66, 392.00, 440.00], // G3, B3, D4, G4, A4 (G6)
  ];

  let currentChordIndex = 0;

  const startSoundscape = () => {
    initAudio();
    setIsPlaying(true);

    const playChordCycle = () => {
      const chord = progressions[currentChordIndex];
      // Play 3 notes of the chord slightly arpeggiated
      chord.forEach((freq, idx) => {
        // Slightly random delays to feel human
        const noteDelay = idx * 0.45 + Math.random() * 0.15;
        // Low octave reinforcement
        if (idx === 0) {
          playRomanticNote(freq / 2, 8.0, noteDelay);
        }
        playRomanticNote(freq, 6.5, noteDelay);
      });

      // Advance chord
      currentChordIndex = (currentChordIndex + 1) % progressions.length;
    };

    // Trigger first immediately
    playChordCycle();

    // Looping progression every 8 seconds
    const interval = window.setInterval(playChordCycle, 8000);
    intervalIdRef.current = interval;
  };

  const stopSoundscape = () => {
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
      startSoundscape();
      // Dispatch custom event so other components know they can trigger chime sounds safely
      window.dispatchEvent(new CustomEvent("ambient-audio-ready"));
    }
  };

  // Exposed helper to play magical chimes on hover or transition
  useEffect(() => {
    const handleTriggerChime = () => {
      if (!audioCtxRef.current || isPlaying === false) return;
      const ctx = audioCtxRef.current;
      const time = ctx.currentTime;

      // Magical chord arpeggio for chime
      const chimeFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (crystal bell)
      chimeFreqs.forEach((freq, i) => {
        const t = time + i * 0.08;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.05, t + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.9);
      });
    };

    window.addEventListener("romantic-chime", handleTriggerChime);
    return () => {
      window.removeEventListener("romantic-chime", handleTriggerChime);
    };
  }, [isPlaying]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        id="bg-music-toggle"
        onClick={toggleSoundscape}
        className={`flex items-center gap-2.5 px-4.5 py-3 rounded-full transition-all duration-500 shadow-lg ${
          isPlaying
            ? "bg-rose-100 text-rose-600 border border-rose-200/60 scale-105"
            : "bg-white/80 text-neutral-500 hover:text-neutral-700 border border-neutral-100 hover:scale-105"
        }`}
        title="Ativar experiência sonora"
      >
        <div className="relative">
          {isPlaying ? (
            <>
              <Volume2 className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </>
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </div>
        <span className="text-xs font-sans tracking-wide font-medium">
          {isPlaying ? "Música Ativa" : "Ativar Som Sensorial"}
        </span>
        {isPlaying && (
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
        )}
      </button>
    </div>
  );
}

// Global function to trigger chimes across the portal
export function triggerStarChime() {
  window.dispatchEvent(new CustomEvent("romantic-chime"));
}
