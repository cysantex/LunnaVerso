import { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, Sparkles, Volume1, ListMusic, Check } from "lucide-react";

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
    id: "satie-gymnopedie",
    name: "Gymnopédie No. 1",
    composer: "Erik Satie",
    vibe: "Suave e Dramática",
    vibeInfo: "Minimalista, terna e nostálgica ✨",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Erik_Satie_-_Gymnop%C3%A9dies_-_No._1.mp3"
  },
  {
    id: "chopin-nocturne",
    name: "Nocturne Op. 9 No. 2",
    composer: "Frédéric Chopin",
    vibe: "Suave e Romântica",
    vibeInfo: "Clássica melodia amorosa 💕",
    url: "https://raw.githubusercontent.com/yishengc/Chopin/master/mp3/Nocturne-Op9-No2.mp3"
  },
  {
    id: "satie-gnossienne",
    name: "Gnossienne No. 1",
    composer: "Erik Satie",
    vibe: "Suave e Misteriosa",
    vibeInfo: "Melancólica e aconchegante 🍂",
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Satie_-_Gnossienne_1.ogg"
  },
  {
    id: "beethoven-moonlight",
    name: "Moonlight Sonata (1st mov.)",
    composer: "Ludwig van Beethoven",
    vibe: "Profunda e Dramática",
    vibeInfo: "Lenta, aconchegante e noturna 🌙",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/23/Ludwig_van_Beethoven_-_Moonlight_Sonata_-_1st_movement.ogg"
  }
];

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Fallback tracklist updated, putting Erik Satie (Gymnopédie No. 1) as absolute default!
  const FALLBACK_MUSIC_URLS = MUSIC_PRESETS.map(p => p.url);

  const defaultMusicUrl = FALLBACK_MUSIC_URLS[0]; // Satie Gymnopédie No. 1
  const finalMusicUrl = (musicUrl && musicUrl.trim()) ? musicUrl.trim() : defaultMusicUrl;

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

  const handleAudioError = () => {
    console.warn("Dificuldade ao carregar arquivo de música.");
    
    // Custom user URL is active if it's not empty, matches the current url, and is not one of our standard presets.
    const isPreset = MUSIC_PRESETS.some(p => p.url === currentMusicUrl);
    const isCustomUrlActive = musicUrl && musicUrl.trim() && currentMusicUrl === musicUrl.trim() && !isPreset;
    
    if (isCustomUrlActive) {
      console.warn("Falha no link de música personalizado do usuário. Fazendo fallback para Chopin...");
      setCurrentMusicUrl(FALLBACK_MUSIC_URLS[1]); // Fallback safely to stable Chopin Nocturne
      setCurrentFallbackIdx(1);
      setHasError(false);
      setTimeout(() => {
        if (isPlaying && audioElRef.current) {
          audioElRef.current.load();
          audioElRef.current.play().catch(pErr => console.warn("Failed play after custom url fallback:", pErr));
        }
      }, 500);
    } else {
      // Loop through fallback URLs
      const nextIdx = (currentFallbackIdx + 1) % FALLBACK_MUSIC_URLS.length;
      // If we haven't looped back to the same failing track
      if (FALLBACK_MUSIC_URLS[nextIdx] !== currentMusicUrl) {
        console.warn(`Tentando áudio clássico alternativo ${nextIdx + 1}/${FALLBACK_MUSIC_URLS.length}...`);
        setCurrentFallbackIdx(nextIdx);
        setCurrentMusicUrl(FALLBACK_MUSIC_URLS[nextIdx]);
        setHasError(false);
        setTimeout(() => {
          if (isPlaying && audioElRef.current) {
            audioElRef.current.load();
            audioElRef.current.play().catch(pErr => {
              console.warn("Failed play after next fallback:", pErr);
              // Show option to tap and rescue
              setHasError(true);
            });
          }
        }, 500);
      } else {
        // Only trigger the hard UI error state if the user is actively attempting to trigger/play audio
        if (isPlaying) {
          setHasError(true);
        }
      }
    }
  };

  // Sync volume with audio element
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
  }, [volume]);

  // Sync music play active state when currentMusicUrl changes
  useEffect(() => {
    if (isPlaying && audioElRef.current) {
      audioElRef.current.load();
      audioElRef.current.play().catch((err) => {
        console.warn("Falha ao tocar trilha após alteração de URL:", err);
        setHasError(true);
      });
    }
  }, [currentMusicUrl]);

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

  const getActiveTrackLabel = () => {
    const matched = MUSIC_PRESETS.find(p => p.url === currentMusicUrl);
    return matched ? matched.name : "Trilha Personalizada";
  };

  const getActiveTrackVibe = () => {
    const matched = MUSIC_PRESETS.find(p => p.url === currentMusicUrl);
    return matched ? matched.vibe : "Música E Ambiência";
  };

  const handleSelectPreset = (url: string) => {
    // 1. Instantly update React state so the UI updates
    setCurrentMusicUrl(url);
    const idx = FALLBACK_MUSIC_URLS.indexOf(url);
    setCurrentFallbackIdx(idx !== -1 ? idx : 0);
    setShowPresets(false);
    setHasError(false);
    
    // 2. Synchronously load and play the audio to retain the user gesture click token!
    if (audioElRef.current) {
      audioElRef.current.src = url; // Mutate src synchronously
      audioElRef.current.volume = volume;
      audioElRef.current.load();
      const playPromise = audioElRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch((err) => {
            console.warn("Synchronous click play promise failed:", err);
            // If blocked, let user tap the helper to manually claim gesture
            setHasError(true);
          });
      } else {
        setIsPlaying(true);
      }
    }
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
      <audio
        ref={audioElRef}
        src={currentMusicUrl}
        loop
        preload="auto"
        onError={handleAudioError}
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
