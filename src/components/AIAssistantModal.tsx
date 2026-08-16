import React, { useState } from "react";
import { X, Sparkles, Send, Wand2, Copy, Check, FileText } from "lucide-react";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNoteFromAI: (title: string, content: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onCreateNoteFromAI,
}) => {
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setAiResponse("");

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.text) {
        setAiResponse(data.text);
      } else {
        setAiResponse("Não foi possível obter uma resposta no momento.");
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Erro ao conectar com o serviço Gemini AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNote = () => {
    if (!aiResponse) return;
    const titleMatch = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
    onCreateNoteFromAI(`✨ IA: ${titleMatch}`, `<p>${aiResponse.replace(/\n/g, "<br/>")}</p>`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-indigo-200 bg-white shadow-2xl dark:border-indigo-900/50 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 dark:border-indigo-950 dark:from-indigo-950/60 dark:to-purple-950/60">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-100">
                Assistente Gemini AI para KeepDocs
              </h2>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                Gere resumos, rascunhos de documentos, análises e ideias para o seu workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Sua Instrução ou Pergunta para a IA
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: 'Escreva um plano de ação para lançamento do produto KeepDocs...', ou 'Crie uma pauta de reunião com 5 tópicos...'"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              disabled={isLoading || !prompt.trim()}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              <span>{isLoading ? "Processando Inteligência..." : "Gerar Resposta com Gemini"}</span>
            </button>
          </div>

          {/* AI Response Box */}
          {aiResponse && (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-zinc-900">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-zinc-800 mb-3">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Resposta Gerada:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {aiResponse}
              </div>

              <button
                onClick={handleCreateNote}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-2xs"
              >
                <FileText className="h-4 w-4" />
                <span>Transformar em Nota no Mosaico</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
