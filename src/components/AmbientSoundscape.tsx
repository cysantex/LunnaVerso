import { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, Sparkles, Volume1 } from "lucide-react";

interface AmbientSoundscapeProps {
  musicUrl?: string;
  key?: string;
}

// Hybrid Web Audio Synthesizer + HTML5 High-Fidelity Audio Streamer
export default function AmbientSoundscape({ musicUrl }: AmbientSoundscapeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45); // Comfortable default
  const [hasError, setHasError] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Chopin's beautiful, emotional Nocturne Op. 9 No. 2 as a bulletproof classical fallback stream
  const defaultMusicUrl = "https://upload.wikimedia.org/wikipedia/commons/e/ee/Fr%C3%A9d%C3%A9ric_Chopin_-_nocturne_in_e-flat_major%2C_op._9_no._2_-_remastered.mp3";
  const finalMusicUrl = (musicUrl && musicUrl.trim()) ? musicUrl.trim() : defaultMusicUrl;

  // Sync volume with audio element
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
  }, [volume]);

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
        console.warn("Web Audio Context not supported in this frame: ", err);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(err => console.warn("Failed to resume AudioContext: ", err));
    }
  };

  const playRomanticNote = (frequency: number, duration: number, delayTime = 0.0) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    try {
      const time = ctx.currentTime + delayTime;

      // Create oscillator
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, time);

      // Delicate, resilient linear envelope to prevent click artifacts
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.04 * (volume / 0.5), time + 0.8); // Scale synth chords with volume
      gainNode.gain.linearRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      console.warn("Could not synthesized chord note: ", e);
    }
  };

  // Celestial backing synth progression: Fmaj9 -> Am9 -> Cmaj9 -> G6 (complements piano)
  const progressions = [
    [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4 (Fmaj9)
    [220.00, 261.63, 329.63, 392.00, 493.88], // A3, C4, E4, G4, B4 (Am9)
    [261.63, 329.63, 392.00, 523.25, 587.33], // C4, E4, G4, C5, D5 (Cmaj9)
    [196.00, 246.94, 293.66, 392.00, 440.00], // G3, B3, D4, G4, A4 (G6)
  ];

  let currentChordIndex = 0;

  const startSoundscape = () => {
    setHasError(false);
    initAudio();

    // 1. Play high-fidelity MP3 streaming audio
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
      const playPromise = audioElRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch((err) => {
            console.warn("Standard HTML5 audio play blocked by browser autoplay sandbox: ", err);
            setIsPlaying(false);
            setHasError(true);
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(true);
    }

    // 2. Start complementary backing pad chords in the background
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    const playChordCycle = () => {
      const chord = progressions[currentChordIndex];
      chord.forEach((freq, idx) => {
        const noteDelay = idx * 0.45 + Math.random() * 0.15;
        // Deep roots
        if (idx === 0) {
          playRomanticNote(freq / 2, 8.0, noteDelay);
        }
        playRomanticNote(freq, 6.5, noteDelay);
      });
      // Rotation
      currentChordIndex = (currentChordIndex + 1) % progressions.length;
    };

    // Cycle first
    playChordCycle();
    const interval = window.setInterval(playChordCycle, 8000);
    intervalIdRef.current = interval;
  };

  const stopSoundscape = () => {
    // 1. Stop MP3 Stream
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch (e) {
        console.warn(e);
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
      startSoundscape();
      // Dispatch listener event
      window.dispatchEvent(new CustomEvent("ambient-audio-ready"));
    }
  };

  // Play crystalline bell chime when selecting milestones
  useEffect(() => {
    const handleTriggerChime = () => {
      // Allow sparkles even if piano is paused, as long as AudioContext exists
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

  return (
    <div className="fixed bottom-4 left-4 right-4 portrait:bottom-5 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto z-50 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl sm:rounded-full shadow-xl border border-rose-100/60 transition-all duration-300">
      
      {/* Invisible loop audio element */}
      <audio
        ref={audioElRef}
        src={finalMusicUrl}
        loop
        preload="auto"
      />

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
          className="flex-1 text-left select-none pr-1 focus:outline-none min-h-[44px] flex flex-col justify-center"
        >
          <span className="text-[9px] font-sans font-bold text-neutral-400 uppercase tracking-widest leading-none">
            Música E Ambiência
          </span>
          <span className="text-[12px] font-sans font-semibold text-neutral-600 hover:text-rose-500 transition-colors mt-0.5 whitespace-nowrap">
            {isPlaying ? "Música Ativa" : "Toque Para Ativar Som"}
          </span>
        </button>

        {/* Elegant volume slider available when active */}
        {isPlaying && (
          <div className="flex items-center gap-1.5 border-l border-neutral-100 pl-3 animate-[fadeIn_0.3s_ease] min-h-[44px]">
            <Volume1 className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 rounded-lg bg-neutral-100 appearance-none cursor-pointer accent-rose-400 outline-none"
              title="Ajustar Volume"
            />
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" style={{ animationDuration: "12s" }} />
          </div>
        )}
      </div>

      {/* Gentle, poetic non-modal helper shown if mobile blocks audio autoplay */}
      {hasError && (
        <div className="text-[10px] text-rose-500 font-sans text-center max-w-[280px] leading-tight px-1 py-0.5 border-t border-rose-50 mt-1.5 animate-pulse">
          Seu celular barrou o som automático. Toque acima novamente para liberar o áudio! 😊
        </div>
      )}
    </div>
  );
}

// Global helper that any card/illustration can call on interaction
export function triggerStarChime() {
  window.dispatchEvent(new CustomEvent("romantic-chime"));
}
