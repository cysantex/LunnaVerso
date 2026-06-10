import { useState, useEffect } from "react";
import { 
  Heart, 
  BookOpen, 
  Sparkles, 
  ChevronRight,
  Bookmark,
  Users,
  Baby,
  Milestone,
  Loader
} from "lucide-react";
import { Chapter, PortalConfig } from "./types";
import FloatingParticles from "./components/FloatingParticles";
import AmbientSoundscape, { triggerStarChime } from "./components/AmbientSoundscape";
import SettingsModal from "./components/SettingsModal";
import { 
  getPortalSettings, 
  savePortalSettings, 
  getChapters, 
  saveChapter, 
  deleteChapter,
  SEED_CONFIG,
  SEED_CHAPTERS,
  getDirectImageUrl
} from "./firebase";

function MiniButterfly({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg 
      className={`${className} inline-block select-none animate-[pulse_3s_infinite] overflow-visible`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft magical romantic watercolor gradients */}
        <linearGradient id="mini-forewing-left" x1="50" y1="52" x2="10" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fda4af" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="mini-forewing-right" x1="50" y1="52" x2="90" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="mini-hindwing-left" x1="50" y1="68" x2="30" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="mini-hindwing-right" x1="50" y1="68" x2="70" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Left Forewing */}
      <path 
        d="M 50,52 C 45,30 25,10 10,25 C -2,37 5,62 50,68 Z" 
        fill="url(#mini-forewing-left)" 
      />
      {/* Left Inner Accent */}
      <path 
        d="M 46,52 C 42,34 27,18 16,30 C 7,39 12,56 46,58 Z" 
        fill="#ffffff" 
        fillOpacity="0.25" 
      />

      {/* Right Forewing */}
      <path 
        d="M 50,52 C 55,30 75,10 90,25 C 102,37 95,62 50,68 Z" 
        fill="url(#mini-forewing-right)" 
      />
      {/* Right Inner Accent */}
      <path 
        d="M 54,52 C 58,34 73,18 84,30 C 93,39 88,56 54,58 Z" 
        fill="#ffffff" 
        fillOpacity="0.25" 
      />

      {/* Left Hindwing */}
      <path 
        d="M 50,68 C 50,68 25,86 35,95 C 45,101 48,85 50,80 Z" 
        fill="url(#mini-hindwing-left)" 
      />
      
      {/* Right Hindwing */}
      <path 
        d="M 50,68 C 50,68 75,86 65,95 C 55,101 52,85 50,80 Z" 
        fill="url(#mini-hindwing-right)" 
      />

      {/* Slender, Elegant Body & Antennae */}
      <g>
        {/* Antennae */}
        <path d="M 50,42 C 49,32 40,24 34,26" stroke="#4b5563" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 50,42 C 51,32 60,24 66,26" stroke="#4b5563" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Glowing Head */}
        <circle cx="50" cy="42" r="2.5" fill="#374151" />
        <circle cx="50" cy="42" r="1.5" fill="#ffffff" fillOpacity="0.6" />
        {/* Elegant Torax & Abdomen */}
        <ellipse cx="50" cy="51" rx="2" ry="6" fill="#374151" />
        <path d="M 49.2,57 C 49.2,57 50,61 50,72 C 50,72 50.8,61 50.8,57 Z" fill="#1f2937" />
        {/* Inner light reflection segment */}
        <ellipse cx="50" cy="51" rx="0.5" ry="3.5" fill="#ffffff" fillOpacity="0.3" />
      </g>
    </svg>
  );
}

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(SEED_CONFIG);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isExcerptExpanded, setIsExcerptExpanded] = useState(false);
  const [hasSoundAlert, setHasSoundAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync to Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [settings, dbChapters] = await Promise.all([
          getPortalSettings(),
          getChapters()
        ]);
        setConfig(settings);
        setChapters(dbChapters);
        // Do not select any chapter by default on load, keeping all chapters unrevealed as requested
        setSelectedChapter(null);
      } catch (err) {
        console.error("Falha ao inicializar banco LunnaVerso:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    const handleAudioReady = () => setHasSoundAlert(true);
    window.addEventListener("ambient-audio-ready", handleAudioReady);
    return () => {
      window.removeEventListener("ambient-audio-ready", handleAudioReady);
    };
  }, []);

  const handleSaveConfig = async (newConfig: PortalConfig) => {
    await savePortalSettings(newConfig);
    setConfig(newConfig);
  };

  const handleSaveChapter = async (targetChapter: Chapter) => {
    await saveChapter(targetChapter);
    // Reload items
    const updatedChapters = await getChapters();
    setChapters(updatedChapters);
    
    // Update currently selected viewport if it was the one modified
    if (selectedChapter && selectedChapter.id === targetChapter.id) {
      setSelectedChapter(targetChapter);
    } else if (!selectedChapter && updatedChapters.length > 0) {
      setSelectedChapter(updatedChapters[0]);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    await deleteChapter(chapterId);
    const updatedChapters = await getChapters();
    setChapters(updatedChapters);

    // If active chapter is deleted, switch
    if (selectedChapter && selectedChapter.id === chapterId) {
      if (updatedChapters.length > 0) {
        setSelectedChapter(updatedChapters[0]);
      } else {
        setSelectedChapter(null);
      }
    }
  };

  const handleResetConfig = async () => {
    // Write defaults back to Firestore
    await savePortalSettings(SEED_CONFIG);
    
    // Clear/Rewrite chapters
    for (const chap of SEED_CHAPTERS) {
      await saveChapter(chap);
    }

    const [settings, updatedChapters] = await Promise.all([
      getPortalSettings(),
      getChapters()
    ]);

    setConfig(settings);
    setChapters(updatedChapters);
    if (updatedChapters.length > 0) {
      setSelectedChapter(updatedChapters[0]);
    } else {
      setSelectedChapter(null);
    }
  };

  const selectMilestone = (chap: Chapter) => {
    setSelectedChapter(chap);
    setIsExcerptExpanded(false);
    triggerStarChime();
  };

  // Helper icon selector based on chapter numbers
  const getChapterIcon = (num: number) => {
    const normalizedNum = Number(num);
    switch (normalizedNum) {
      case 1: return <Heart className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />;
      case 2: return <Bookmark className="h-4 w-4 text-indigo-300 group-hover:scale-110 transition-transform" />;
      case 3: return <Baby className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" fill="#fde047" fillOpacity="0.2" />;
      case 4: return <Users className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />;
      case 5: return <Sparkles className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />;
      default: return <Milestone className="h-4 w-4 text-rose-400" />;
    }
  };

  // Graceful Ethereal Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-indigo-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <FloatingParticles />
        <div className="relative text-center z-10 space-y-4">
          <div className="relative inline-block">
            <Heart className="h-10 w-10 text-rose-300 animate-pulse fill-rose-100" />
            <Loader className="absolute top-0 left-0 h-10 w-10 text-rose-400 animate-spin opacity-60" />
          </div>
          <h3 className="font-serif text-2xl text-neutral-700 tracking-wide">Sincronizando LunnaVerso</h3>
          <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest animate-pulse">
            Carregando memórias do livro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-indigo-50/50 relative overflow-x-hidden flex flex-col selection:bg-rose-200/50 selection:text-neutral-800">
      
      {/* Dynamic particles fluttering in the background */}
      <FloatingParticles />

      {/* Sensorial Soundscape integration */}
      <AmbientSoundscape musicUrl={config.backgroundMusicUrl} />

      {/* TOP DECORATIVE FLUID OVERLAY BANNER */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-300 via-gold-200 to-sage-100 z-10" />

      {/* APP CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-20 relative z-10 flex-1 flex flex-col">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-11 pb-6 border-b border-rose-100/60">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-1 w-12 bg-rose-300 rounded-full inline-block" />
              <span className="text-rose-500 font-serif italic text-sm tracking-wide flex items-center gap-1">
                Material Extra Oficial de Romance <MiniButterfly className="h-4 w-4 animate-bounce" />
              </span>
            </div>
            <h1 className="font-serif text-3.5xl md:text-5xl text-neutral-800 font-light tracking-tight leading-none">
              {config.bookTitle}
            </h1>
            <p className="text-neutral-500 text-xs font-sans tracking-widest uppercase mt-2.5">
              Por <span className="font-medium text-rose-400">{config.authorName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SettingsModal 
              config={config} 
              chapters={chapters}
              onSaveConfig={handleSaveConfig} 
              onSaveChapter={handleSaveChapter}
              onDeleteChapter={handleDeleteChapter}
              onReset={handleResetConfig} 
            />
          </div>
        </header>

        {/* INTRODUCTORY CARD (LETTER) */}
        <section id="welcome-letter-card" className="mb-12 glass-panel rounded-3xl p-6.5 md:p-8 dreamy-glow border border-white/60 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-rose-100/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100/50 rounded-2xl text-rose-500 shrink-0 hidden sm:block shadow-sm">
              <MiniButterfly className="h-7 w-7" />
            </div>

            <div>
              <h2 className="font-serif text-2xl text-neutral-800 font-medium mb-3 tracking-tight flex items-center gap-2">
                {config.welcomeTitle}
                <MiniButterfly className="h-5 w-5 animate-pulse" />
              </h2>
              <p className="text-neutral-600 font-sans text-sm md:text-base leading-relaxed font-light">
                {config.welcomeMessage}
              </p>
              
              {!hasSoundAlert && (
                <p className="text-rose-400/80 font-serif italic text-xs mt-3 flex items-center gap-1.5 animate-pulse">
                  <Heart className="h-3 w-3 fill-rose-300/40" /> 
                  Dica sensorial: Clique no botão &quot;Ativar Som Sensorial&quot; no canto inferior direito para ouvir a alma da história!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* INTERACTIVE JOURNAL PORTAL TIMELINE & DISPLAY GRID */}
        {chapters.length === 0 ? (
          <div id="no-moments-placeholder" className="glass-panel p-12 text-center rounded-3xl min-h-[300px] flex flex-col justify-center items-center">
            <Heart className="h-10 w-10 text-neutral-300 mb-2 stroke-1" />
            <h3 className="font-serif text-xl text-neutral-600">Nenhum capítulo cadastrado no LunnaVerso</h3>
            <p className="text-xs text-neutral-400 font-sans max-w-sm mt-1">
              Abra a aba Configurações acima e crie um capítulo com uma bela ilustração de seu livro.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
            
            {/* STEP NAVIGATION TIMELINE SIDEBAR (5 Cols) */}
            <div className="lg:col-span-5 space-y-3.5 order-2 lg:order-1">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs uppercase font-sans font-medium text-neutral-400 tracking-wider">
                  Momentos Ilustrados ({chapters.length})
                </span>
                <span className="text-xs font-serif text-rose-500 italic">
                  Selecione para revelar
                </span>
              </div>

              <div className="space-y-3">
                {chapters.map((chap) => {
                  const isSelected = selectedChapter?.id === chap.id;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => selectMilestone(chap)}
                      className={`w-full text-left p-4.5 rounded-2xl font-sans transition-all duration-300 flex items-start gap-4 relative group overflow-hidden border ${
                        isSelected
                          ? "bg-white/95 border-rose-200/70 shadow-md text-neutral-800 translate-x-1.5"
                          : "bg-white/40 hover:bg-white/70 border-white/50 text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {/* Visual left highlight for active selection */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.2 bg-gradient-to-b from-rose-400 to-amber-300 rounded-r-md" />
                      )}

                      <div className={`p-2.5 rounded-xl shrink-0 transition-all duration-300 ${
                        isSelected 
                          ? "bg-rose-50 text-rose-500" 
                          : "bg-neutral-100/50 group-hover:bg-rose-50/40 text-neutral-400"
                      }`}>
                        {getChapterIcon(chap.number)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                            Momento 0{chap.number}
                          </span>
                          {isSelected && (
                            <span className="text-[10.5px] font-medium text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">
                              Ativo
                            </span>
                          )}
                        </div>
                        <h3 className={`font-serif text-lg font-medium tracking-tight truncate leading-tight ${
                          isSelected ? "text-neutral-800" : "text-neutral-700 group-hover:text-rose-500"
                        }`}>
                          {chap.title}
                        </h3>
                        <p className="text-xs text-neutral-400 font-light truncate mt-1">
                          {chap.shortDescription}
                        </p>
                      </div>

                      <ChevronRight className={`h-4 w-4 shrink-0 mt-3.5 transition-transform duration-300 ${
                        isSelected 
                          ? "text-rose-400 translate-x-1" 
                          : "text-neutral-300 group-hover:text-neutral-500"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE PORTAL CANVAS DISPLAY (7 Cols) */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              {selectedChapter ? (
                <div className="bg-white/80 border border-white rounded-3xl p-5 md:p-6.5 shadow-xl dreamy-glow relative overflow-hidden transition-all duration-500">
                  
                  {/* ILLUSTRATION COVER ART FRAME */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-rose-50 group shadow-inner border border-neutral-100 mb-6 flex items-center justify-center">
                    
                    {/* Floating soft color blob behind image to enhance watercolor mood */}
                    <div className="absolute inset-0 bg-radial-gradient from-rose-200/40 via-amber-100/10 to-transparent blur-xl pointer-events-none" />

                    {/* Ambient blurred backdrop of the same image to eliminate letterbox empty gaps elegantly */}
                    <img
                      src={getDirectImageUrl(selectedChapter.imageUrl)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 select-none scale-105 pointer-events-none"
                    />

                    {/* The main active romantic image, fitting cleanly without cropping */}
                    <img
                      key={selectedChapter.id}
                      src={getDirectImageUrl(selectedChapter.imageUrl)}
                      alt={selectedChapter.title}
                      referrerPolicy="no-referrer"
                      className="relative z-10 w-full h-full object-contain transition-all duration-1000 scale-100 group-hover:scale-[1.02] filter saturate-[0.95] sepia-[0.02] brightness-[1.01]"
                    />

                    {/* Dynamic corner ornaments */}
                  </div>

                  {/* STORYBOARD TITLES */}
                  <div className="space-y-2 mb-5">
                    <span className="text-xs uppercase font-sans tracking-widest font-semibold text-rose-400/90 block">
                      Cores da Alma — Iluminação 0{selectedChapter.number}
                    </span>
                    <h2 className="font-serif text-2.5xl md:text-3.5xl text-neutral-800 font-medium tracking-tight leading-tight">
                      {selectedChapter.title}
                    </h2>
                    <p className="text-neutral-500 font-sans italic text-sm md:text-base font-light">
                      {selectedChapter.subtitle}
                    </p>
                  </div>

                  {/* BEAUTIFUL POETIC KEY QUOTE FRAME */}
                  <div className="border-l-2 border-rose-300 italic pl-4.5 py-1 my-5.5 bg-rose-50/20 rounded-r-xl pr-3">
                    <p className="font-serif text-neutral-700 text-lg leading-relaxed font-light">
                      &ldquo;{selectedChapter.romanticQuote}&rdquo;
                    </p>
                  </div>

                  {/* EXCERPT DETAIL CHRONICLE toggler */}
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setIsExcerptExpanded(!isExcerptExpanded);
                        triggerStarChime();
                      }}
                      className="flex items-center gap-2 text-rose-500 px-4 py-2 hover:bg-rose-50/50 rounded-xl transition text-sm font-sans tracking-wide font-medium border border-rose-200/50 cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      {isExcerptExpanded ? "Ocultar Crônica Escrita" : "Ler Crônica Relacionada do Livro"}
                    </button>

                    {isExcerptExpanded && (
                      <div className="text-neutral-600 font-sans text-sm md:text-base leading-relaxed font-light bg-neutral-50/70 p-5 rounded-2xl border border-neutral-100 animate-[fadeIn_0.31s_ease-out]">
                        <p className="whitespace-pre-line first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-rose-400 first-letter:font-bold">
                          {selectedChapter.fullStory}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div id="no-chapter-selected-placeholder" className="bg-white/60 border border-dashed border-rose-200/80 rounded-3xl p-8 md:p-12 text-center shadow-md flex flex-col items-center justify-center min-h-[380px] dreamy-glow animate-[fadeIn_0.5s_ease-out]">
                  <div className="p-3.5 bg-rose-50 rounded-full text-rose-400 mb-4 animate-[bounce_4s_infinite] shadow-sm flex items-center justify-center">
                    <MiniButterfly className="h-10 w-10" />
                  </div>
                  <h3 className="font-serif text-2xl text-neutral-800 font-light mb-2">Desvende os Capítulos</h3>
                  <p className="text-neutral-500 font-sans text-sm max-w-sm leading-relaxed mb-6">
                    Selecione um dos momentos ilustrados na linha do tempo ao lado para revelar as belas aquarelas e as crônicas do romance.
                  </p>
                  <div className="flex gap-2 text-rose-400 font-serif italic text-xs items-center">
                    <MiniButterfly className="h-3 w-3" /> Cada escolha revela um pedaço de nossa transformação.
                  </div>
                </div>
              )}
            </div>

          </section>
        )}

        {/* ROMANTIC DEDICATORY AND AUTHOR MESSAGE (FOOTER CALL-TO-ACTION) */}
        <section id="romantic-dedicatory-card" className="glass-panel border-rose-100/60 border rounded-3xl p-8 text-center max-w-3xl mx-auto md:mb-6 shadow-xl dreamy-glow relative overflow-hidden">
          
          <div className="absolute top-0 right-0 p-3 text-amber-300 opacity-40">
            <Sparkles className="h-8 w-8 animate-spin" style={{ animationDuration: "16s" }} />
          </div>

          <Heart className="h-6 w-6 text-rose-400 mx-auto mb-3 fill-rose-100 animate-pulse" />

          <p className="text-[11px] uppercase tracking-widest font-sans font-semibold text-rose-400 mb-2">
            Mensagem do Coração
          </p>

          <p className="font-serif italic text-lg md:text-xl text-neutral-700 font-light max-w-lg mx-auto leading-relaxed">
            &ldquo;{config.romanticDedicatory}&rdquo;
          </p>

          <div className="mt-5 flex justify-center gap-1.5 items-center text-[11px] text-neutral-400 uppercase tracking-widest font-sans font-medium">
            <span>Lunna Balduíno</span>
          </div>
        </section>

      </main>

      {/* FINAL HUMBLE FOOTER FOR BOOK AND APPLET */}
      <footer className="w-full text-center py-8 border-t border-rose-100/20 bg-white/20 relative z-10">
        <p className="text-xs text-neutral-400 font-sans tracking-wide">
          © 2026 {config.bookTitle} — Conectado ao banco de dados LunnaVerso.
        </p>
      </footer>
    </div>
  );
}
