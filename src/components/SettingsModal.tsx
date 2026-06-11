import { useState, FormEvent } from "react";
import { X, Save, RotateCcw, Settings, Plus, Edit2, Trash2, BookOpen, Layers } from "lucide-react";
import { Chapter, PortalConfig } from "../types";
import { triggerStarChime, MUSIC_PRESETS } from "./AmbientSoundscape";
import { getDirectImageUrl } from "../firebase";

interface SettingsModalProps {
  config: PortalConfig;
  chapters: Chapter[];
  onSaveConfig: (newConfig: PortalConfig) => Promise<void>;
  onSaveChapter: (chapter: Chapter) => Promise<void>;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export default function SettingsModal({
  config,
  chapters,
  onSaveConfig,
  onSaveChapter,
  onDeleteChapter,
  onReset
}: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "chapters">("general");

  // Local state for editing main configurations
  const [localConfig, setLocalConfig] = useState<PortalConfig>({ ...config });

  // Local state for managing individual chapters
  const [selectedEditChapterId, setSelectedEditChapterId] = useState<string | null>(null);
  const [localChapterForm, setLocalChapterForm] = useState<Chapter | null>(null);

  // Password unlock state for Author/Admin panel
  const [passwordInput, setPasswordInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Loading indicators
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => {
    setLocalConfig({ ...config });
    setSelectedEditChapterId(null);
    setLocalChapterForm(null);
    setActiveTab("general");
    setPasswordInput("");
    setIsUnlocked(false);
    setPasswordError("");
    setIsOpen(true);
    triggerStarChime();
  };

  const handleUnlockSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === "LunnaVerso@1") {
      setIsUnlocked(true);
      setPasswordError("");
      triggerStarChime();
    } else {
      setPasswordError("Senha incorreta. Certifique-se de respeitar maiúsculas e minúsculas.");
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(localConfig);
      setIsOpen(false);
      triggerStarChime();
    } catch (e) {
      alert("Houve um problema ao salvar as configurações: " + String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm("Deseja mesmo restaurar as configurações globais originais no banco LunnaVerso? Os capítulos customizados no banco também serão resetados para os padrões.")) {
      setIsSaving(true);
      try {
        await onReset();
        setIsOpen(false);
        triggerStarChime();
      } catch (e) {
        alert("Erro no reset: " + String(e));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSelectEditChapter = (chap: Chapter) => {
    setSelectedEditChapterId(chap.id);
    setLocalChapterForm({ ...chap });
    triggerStarChime();
  };

  const handleCreateNewChapter = () => {
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
    const newId = `chap_${Date.now()}`;
    const newChap: Chapter = {
      id: newId,
      number: nextNum,
      title: "Título do Novo Capítulo",
      subtitle: "Subtítulo poético complementar",
      shortDescription: "Uma breve descrição literária que resume o momento.",
      fullStory: "Era uma vez... Escreva aqui o conto detalhado desta ilustração do livro.",
      imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7",
      romanticQuote: "Insira uma bela citação romântica de destaque para tocar a alma.",
      isGrayscale: false
    };
    setSelectedEditChapterId(newId);
    setLocalChapterForm(newChap);
    triggerStarChime();
  };

  const handleSaveChapterForm = async () => {
    if (!localChapterForm) return;

    // Direct validation as matched by our database security rules
    if (!localChapterForm.title.trim() || !localChapterForm.fullStory.trim()) {
      alert("Por favor, preencha o título e a história completa do capítulo.");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveChapter(localChapterForm);
      setSelectedEditChapterId(null);
      setLocalChapterForm(null);
      triggerStarChime();
    } catch (err) {
      alert("Falha ao salvar capítulo no LunnaVerso: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChapterClick = async (chapterId: string) => {
    if (window.confirm("Pretende realmente deletar este capítulo e sua ilustração do banco de dados?")) {
      setIsSaving(true);
      try {
        await onDeleteChapter(chapterId);
        if (selectedEditChapterId === chapterId) {
          setSelectedEditChapterId(null);
          setLocalChapterForm(null);
        }
        triggerStarChime();
      } catch (err) {
        alert("Falha ao deletar: " + String(err));
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <button
        id="open-settings-btn"
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-50/40 transition-all font-sans text-[11px] font-medium cursor-pointer"
        title="Painel do Autor (Configurações)"
      >
        <Settings className="h-3.5 w-3.5" />
        Configuração
      </button>

      {isOpen && (
        <div className="settings-modal-overlay fixed inset-0 bg-neutral-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/98 max-w-2xl w-full rounded-2xl shadow-2xl border border-rose-100 relative max-h-[85vh] overflow-hidden flex flex-col">
            
            {!isUnlocked ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-rose-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-neutral-800 font-medium">Acesso Restrito</h3>
                    <p className="text-neutral-500 text-xs font-sans mt-0.5">
                      Esta área é exclusiva para os autores e administradores do LunnaVerso.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUnlockSubmit} className="p-8 flex flex-col items-center justify-center space-y-5 my-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50/80 text-rose-500 flex items-center justify-center shadow-inner mb-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>

                  <div className="w-full max-w-sm space-y-2">
                    <label className="block text-center text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Senha do Painel de Edição
                    </label>
                    <input
                      type="password"
                      placeholder="Digite a senha..."
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError("");
                      }}
                      className="w-full text-center text-sm px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 transition shadow-sm"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="text-[11px] text-rose-500 text-center font-medium mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-4 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer"
                    >
                      Desbloquear
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 pb-4 border-b border-rose-50 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl text-neutral-800 font-medium">Bando de Dados LunnaVerso</h3>
                <p className="text-neutral-500 text-xs font-sans mt-0.5">
                  Gerencie em tempo real de forma escalável todos os textos e capítulos do seu portal de romance.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Custom Interactive Tabs */}
            <div className="flex border-b border-neutral-100 px-6.5 bg-neutral-50/50">
              <button
                onClick={() => { setActiveTab("general"); triggerStarChime(); }}
                className={`py-3 text-xs uppercase tracking-wider font-sans font-semibold border-b-2 px-4 transition-all flex items-center gap-2 ${
                  activeTab === "general"
                    ? "border-rose-400 text-rose-500"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Textos Globais
              </button>
              <button
                onClick={() => { setActiveTab("chapters"); triggerStarChime(); }}
                className={`py-3 text-xs uppercase tracking-wider font-sans font-semibold border-b-2 px-4 transition-all flex items-center gap-2 ${
                  activeTab === "chapters"
                    ? "border-rose-400 text-rose-500"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <Layers className="h-4 w-4" />
                Gerenciar Capítulos
              </button>
            </div>

            {/* Scrollable Content Pane */}
            <div className="p-6.5 overflow-y-auto flex-1 max-h-[50vh]">
              
              {/* TAB 1: GENERAL CONFIGS */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
                        Título do Livro
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                        value={localConfig.bookTitle}
                        onChange={(e) => setLocalConfig({ ...localConfig, bookTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
                        Autoria do Romance
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                        value={localConfig.authorName}
                        onChange={(e) => setLocalConfig({ ...localConfig, authorName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
                      Título do Painel de Boas-vindas
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                      value={localConfig.welcomeTitle}
                      onChange={(e) => setLocalConfig({ ...localConfig, welcomeTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
                      Carta de Mensagem ao Leitor
                    </label>
                    <textarea
                      rows={4}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300 resize-none"
                      value={localConfig.welcomeMessage}
                      onChange={(e) => setLocalConfig({ ...localConfig, welcomeMessage: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
                      Dedicatória Emocional do Rodapé
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                      value={localConfig.romanticDedicatory}
                      onChange={(e) => setLocalConfig({ ...localConfig, romanticDedicatory: e.target.value })}
                    />
                  </div>

                   <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2.5">
                        Trilhas Sonoras Recomendadas (Suaves & Românticas)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                        {MUSIC_PRESETS.map((track) => {
                          const isActive = localConfig.backgroundMusicUrl === track.url || 
                            ((!localConfig.backgroundMusicUrl || localConfig.backgroundMusicUrl.trim() === "") && track.id === "chopin-nocturne");
                          return (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                setLocalConfig({ ...localConfig, backgroundMusicUrl: track.url });
                                triggerStarChime();
                              }}
                              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all active:scale-98 ${
                                isActive 
                                  ? "bg-rose-50/70 border-rose-200 text-rose-800 shadow-sm" 
                                  : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 bg-white"
                              }`}
                            >
                              <span className="text-xs font-bold">{track.name}</span>
                              <span className="text-[10px] text-neutral-400 mt-0.5 font-medium">Melodia por {track.composer}</span>
                              <div className="mt-2 flex items-center justify-between w-full text-[9.5px] font-semibold text-rose-500/90">
                                <span>{track.vibe}</span>
                                {isActive && <span className="bg-rose-100/80 text-rose-700 px-2 py-0.5 rounded-full text-[8.5px]">Ativa</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">
                        Ou insira um link de áudio personalizado
                      </label>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/musica.mp3"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                        value={localConfig.backgroundMusicUrl || ""}
                        onChange={(e) => setLocalConfig({ ...localConfig, backgroundMusicUrl: e.target.value })}
                      />
                      <p className="text-[10px] text-neutral-400 mt-1.5 leading-normal">
                        Sugerimos selecionar um dos nossos presets clássicos otimizados. Se preferir um arquivo próprio, cole um link direto terminado em <strong>.mp3</strong> ou <strong>.ogg</strong> (como do Pixabay Música). Links de páginas como YouTube ou Spotify não funcionam como reprodutor de áudio direto.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHAPTER EDITOR & CREATION */}
              {activeTab === "chapters" && (
                <div className="space-y-5">
                  
                  {/* Se NÃO estiver editando ativamente nenhum capítulo, exibe a lista dos existentes */}
                  {!localChapterForm ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 font-medium">Momentos Cadastrados no Banco</span>
                        <button
                          onClick={handleCreateNewChapter}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition font-sans text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar Novo Momento
                        </button>
                      </div>

                      <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white">
                        {chapters.map((chap) => (
                          <div key={chap.id} className="flex items-center justify-between p-3.5 hover:bg-neutral-50/50 transition">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 font-serif font-bold flex items-center justify-center text-sm shrink-0">
                                {chap.number}
                              </span>
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700">{chap.title}</h4>
                                <p className="text-[11px] text-neutral-400 truncate max-w-md">{chap.subtitle}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSelectEditChapter(chap)}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition"
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteChapterClick(chap.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition"
                                title="Deletar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // FORM DE EDIÇÃO DO CAPÍTULO INTEGRADO
                    <div className="space-y-4 border border-rose-100/50 p-4.5 rounded-xl bg-rose-50/10">
                      <div className="flex items-center justify-between mb-3 border-b border-rose-100/50 pb-2">
                        <span className="text-xs uppercase tracking-wider font-semibold text-rose-500">
                          {selectedEditChapterId && chapters.some(c => c.id === selectedEditChapterId) ? "Editando Momento" : "Adicionando Novo Momento"}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setSelectedEditChapterId(null); setLocalChapterForm(null); }}
                          className="text-xs text-neutral-400 hover:text-rose-500 font-sans font-medium hover:underline cursor-pointer transition-colors"
                        >
                          ← Voltar para lista
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                            Número Ordenador
                          </label>
                          <input
                            type="number"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                            value={localChapterForm.number}
                            onChange={(e) => setLocalChapterForm({ ...localChapterForm, number: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                            Título da Ilustração / Capítulo
                          </label>
                          <input
                            type="text"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                            value={localChapterForm.title}
                            onChange={(e) => setLocalChapterForm({ ...localChapterForm, title: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          Frase do Subtítulo Poético
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                          value={localChapterForm.subtitle}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, subtitle: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          Resumo / Descrição Menu
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                          value={localChapterForm.shortDescription}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, shortDescription: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          URL Externa da Ilustração (Unsplash, Drive público, Link etc)
                        </label>
                        <input
                          type="url"
                          className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                          value={localChapterForm.imageUrl}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, imageUrl: e.target.value })}
                          placeholder="Ex: https://drive.google.com/file/d/... ou outro link público"
                        />
                        
                        {/* Live image preview and Google Drive conversion visual feedback */}
                        {localChapterForm.imageUrl && (
                          <div className="mt-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3.5">
                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-neutral-200/50 border border-neutral-200 shrink-0 relative flex items-center justify-center">
                              <img
                                src={getDirectImageUrl(localChapterForm.imageUrl)}
                                alt="Preview"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <span className="text-[10px] text-neutral-400 font-sans absolute">Mini</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 leading-snug">
                              {localChapterForm.imageUrl.includes("drive.google.com") ? (
                                <span className="text-emerald-600 font-medium font-sans flex items-center gap-1">
                                  ✓ Link do Google Drive adaptado e compatível!
                                </span>
                              ) : (
                                <span className="text-neutral-400 font-sans font-medium">Prévia da imagem carregada.</span>
                              )}
                              <p className="text-[9.5px] text-neutral-400 italic mt-0.5">
                                Certifique-se de que a imagem esteja compartilhada como &ldquo;Qualquer pessoa com o link&rdquo;.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          Frase / Citação Romântica de Impacto
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300"
                          value={localChapterForm.romanticQuote}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, romanticQuote: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                          História Contada Completa (Crônica Sensorial)
                        </label>
                        <textarea
                          rows={4}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-rose-300 resize-none font-sans"
                          value={localChapterForm.fullStory}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, fullStory: e.target.value })}
                        />
                      </div>

                      <div className="flex items-start gap-3.5 p-3.5 bg-rose-50/30 rounded-xl border border-rose-100/50">
                        <input
                          id="is-grayscale-checkbox"
                          type="checkbox"
                          className="w-4 h-4 text-rose-500 border-neutral-300 rounded focus:ring-rose-500/50 cursor-pointer accent-rose-500 shrink-0 mt-0.5"
                          checked={!!localChapterForm.isGrayscale}
                          onChange={(e) => setLocalChapterForm({ ...localChapterForm, isGrayscale: e.target.checked })}
                        />
                        <div className="flex-1 select-none">
                          <label htmlFor="is-grayscale-checkbox" className="text-xs text-neutral-700 font-bold block cursor-pointer">
                            Aplicar filtro P&B inicial (Sensorial)
                          </label>
                          <span className="text-[10.5px] text-neutral-400 mt-0.5 block leading-relaxed font-sans font-normal">
                            A ilustração aparecerá inicialmente em Preto e Branco. Ela revelará suas cores reais (aquarela original) com um efeito sutil quando o leitor clicar em qualquer lugar da tela!
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 justify-end">
                        <button
                          type="button"
                          onClick={() => { setSelectedEditChapterId(null); setLocalChapterForm(null); }}
                          className="px-3 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 rounded-lg transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveChapterForm}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow rounded-lg transition disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {isSaving ? "Gravando no LunnaVerso..." : "Gravar Capítulo"}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Bottom Actions BAR */}
            <div className="p-5 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <button
                type="button"
                onClick={handleResetAll}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Derrubar para Originais
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100/70 rounded-xl transition"
                >
                  Fechar
                </button>
                {activeTab === "general" && (
                  <button
                    type="button"
                    onClick={handleSaveGeneral}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-md rounded-xl transition disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSaving ? "Salvando textos..." : "Salvar Configurações"}
                  </button>
                )}
              </div>
            </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
