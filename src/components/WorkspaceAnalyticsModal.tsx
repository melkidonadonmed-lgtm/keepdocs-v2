import React, { useState, useMemo } from "react";
import {
  X,
  BarChart3,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  ListTodo,
  Layers,
  Sparkles,
  Send,
  Download,
  Folder as FolderIcon,
  Tag,
  Palette,
  TrendingUp,
  Clock,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Note, Folder } from "../types";
import { COLOR_CATEGORIES } from "../services/colorPaletteService";

interface WorkspaceAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  onOpenNote?: (note: Note) => void;
}

export const WorkspaceAnalyticsModal: React.FC<WorkspaceAnalyticsModalProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onOpenNote,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "chat">("overview");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Aggregated Workspace Metrics (workspace-data-analytics-architect pattern)
  const metrics = useMemo(() => {
    const activeNotes = notes.filter((n) => !n.trashed);
    const totalNotes = activeNotes.length;

    const byType = {
      doc: activeNotes.filter((n) => n.type === "doc").length,
      sheet: activeNotes.filter((n) => n.type === "sheet").length,
      form: activeNotes.filter((n) => n.type === "form").length,
      canvas: activeNotes.filter((n) => n.type === "canvas").length,
      checklist: activeNotes.filter((n) => n.type === "checklist").length,
      standard: activeNotes.filter((n) => n.type === "standard" || !n.type).length,
    };

    let totalTasks = 0;
    let completedTasks = 0;
    activeNotes.forEach((n) => {
      if (Array.isArray(n.checklist)) {
        totalTasks += n.checklist.length;
        completedTasks += n.checklist.filter((i) => i.completed).length;
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Recent edits in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEdits = activeNotes.filter(
      (n) => new Date(n.updatedAt).getTime() >= sevenDaysAgo.getTime()
    ).length;

    // Pinned notes
    const pinnedCount = activeNotes.filter((n) => n.pinned).length;

    // Tag counts
    const tagMap: Record<string, number> = {};
    activeNotes.forEach((n) => {
      n.tags.forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Color counts
    const colorMap: Record<string, number> = {};
    activeNotes.forEach((n) => {
      const c = n.color || "default";
      colorMap[c] = (colorMap[c] || 0) + 1;
    });

    // Folder counts
    const folderMap: Record<string, number> = {};
    folders.forEach((f) => {
      folderMap[f.id] = activeNotes.filter((n) => n.folderId === f.id).length;
    });

    return {
      totalNotes,
      byType,
      totalTasks,
      completedTasks,
      completionRate,
      recentEdits,
      pinnedCount,
      topTags,
      colorMap,
      folderMap,
    };
  }, [notes, folders]);

  // Handle Natural Language Query with Workspace Data
  const handleRunAiAnalysis = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatPrompt;
    if (!promptToSend.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setChatError(null);

    try {
      // Build lightweight structured context of notes
      const workspaceContext = {
        metricsSummary: {
          totalNotes: metrics.totalNotes,
          byType: metrics.byType,
          totalTasks: metrics.totalTasks,
          completedTasks: metrics.completedTasks,
          completionRate: `${metrics.completionRate}%`,
        },
        notes: notes
          .filter((n) => !n.trashed)
          .slice(0, 50)
          .map((n) => ({
            id: n.id,
            title: n.title,
            type: n.type,
            color: n.color,
            tags: n.tags,
            pinned: n.pinned,
            checklist: n.checklist,
            tablesCount: n.tables?.length || 0,
            hasSheet: Boolean(n.sheetData),
            updatedAt: n.updatedAt,
          })),
      };

      const res = await fetch("/api/gemini/analyze-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          workspaceContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao se comunicar com o Gemini para análise de dados.");
      }

      const data = await res.json();
      setChatResponse(data.text);
    } catch (err: any) {
      console.error("Erro na análise do workspace:", err);
      setChatError(err.message || "Erro ao processar análise analítica.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export metrics report to CSV
  const handleExportCsv = () => {
    const lines = [
      "Métrica,Valor",
      `Total de Notas,${metrics.totalNotes}`,
      `Documentos Ricos,${metrics.byType.doc}`,
      `Planilhas Integradas,${metrics.byType.sheet}`,
      `Formulários Dinâmicos,${metrics.byType.form}`,
      `Anotações Canvas,${metrics.byType.canvas}`,
      `Total de Tarefas,${metrics.totalTasks}`,
      `Tarefas Concluídas,${metrics.completedTasks}`,
      `Taxa de Conclusão,${metrics.completionRate}%`,
      `Edições nos últimos 7 dias,${metrics.recentEdits}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keepdocs_metrics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#0e1b22] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.15)] bg-[#122129] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2aa198]/20 text-[#2aa198]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#eee8d5] tracking-tight">
                Dashboard & Métricas do Workspace
              </h2>
              <p className="text-xs text-[#93a1a1]">
                Visão consolidada de produtividade e chat analítico em tempo real
              </p>
            </div>
          </div>

          {/* Tab Selector & Close */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-[#081419] p-0.5 border border-[rgba(147,161,161,0.15)]">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "overview"
                    ? "bg-[#2aa198] text-[#002b36] font-semibold"
                    : "text-[#93a1a1] hover:text-[#eee8d5]"
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "chat"
                    ? "bg-[#2aa198] text-[#002b36] font-semibold"
                    : "text-[#93a1a1] hover:text-[#eee8d5]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chat com Dados</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#93a1a1] hover:bg-[#081419] hover:text-[#eee8d5] transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === "overview" ? (
            <>
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/60 p-4">
                  <div className="flex items-center justify-between text-[#93a1a1]">
                    <span className="text-xs font-medium">Total de Notas</span>
                    <Layers className="h-4 w-4 text-[#2aa198]" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-[#eee8d5]">
                    {metrics.totalNotes}
                  </div>
                  <div className="mt-1 text-[11px] text-[#586e75]">
                    {metrics.pinnedCount} fixadas no topo
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/60 p-4">
                  <div className="flex items-center justify-between text-[#93a1a1]">
                    <span className="text-xs font-medium">Documentos & Docs</span>
                    <FileText className="h-4 w-4 text-[#268bd2]" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-[#eee8d5]">
                    {metrics.byType.doc}
                  </div>
                  <div className="mt-1 text-[11px] text-[#586e75]">
                    {metrics.byType.sheet} planilhas ativas
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/60 p-4">
                  <div className="flex items-center justify-between text-[#93a1a1]">
                    <span className="text-xs font-medium">Tarefas / Checklists</span>
                    <CheckCircle2 className="h-4 w-4 text-[#859900]" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-[#eee8d5]">
                    {metrics.completionRate}%
                  </div>
                  <div className="mt-1 text-[11px] text-[#586e75]">
                    {metrics.completedTasks} de {metrics.totalTasks} concluídas
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/60 p-4">
                  <div className="flex items-center justify-between text-[#93a1a1]">
                    <span className="text-xs font-medium">Atividade Recente</span>
                    <TrendingUp className="h-4 w-4 text-[#cb4b16]" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-[#eee8d5]">
                    {metrics.recentEdits}
                  </div>
                  <div className="mt-1 text-[11px] text-[#586e75]">
                    edições nos últimos 7 dias
                  </div>
                </div>
              </div>

              {/* Progress & Distribution Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tipos de Conteúdo */}
                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/40 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#93a1a1]">
                    Distribuição por Tipo de Módulo
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[#eee8d5] mb-1">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-[#268bd2]" /> Documentos Ricos
                        </span>
                        <span className="font-mono text-[#93a1a1]">{metrics.byType.doc}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#002b36]">
                        <div
                          className="h-full rounded-full bg-[#268bd2]"
                          style={{
                            width: `${metrics.totalNotes ? (metrics.byType.doc / metrics.totalNotes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#eee8d5] mb-1">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-[#859900]" /> Mini-Planilhas
                        </span>
                        <span className="font-mono text-[#93a1a1]">{metrics.byType.sheet}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#002b36]">
                        <div
                          className="h-full rounded-full bg-[#859900]"
                          style={{
                            width: `${metrics.totalNotes ? (metrics.byType.sheet / metrics.totalNotes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#eee8d5] mb-1">
                        <span className="flex items-center gap-2">
                          <ListTodo className="h-3.5 w-3.5 text-[#b58900]" /> Formulários Dinâmicos
                        </span>
                        <span className="font-mono text-[#93a1a1]">{metrics.byType.form}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#002b36]">
                        <div
                          className="h-full rounded-full bg-[#b58900]"
                          style={{
                            width: `${metrics.totalNotes ? (metrics.byType.form / metrics.totalNotes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Tags & Pastas */}
                <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/40 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#93a1a1]">
                    Principais Tags do Workspace
                  </h3>
                  {metrics.topTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {metrics.topTags.map(([tag, count]) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b36] px-2.5 py-1 text-xs text-[#eee8d5] border border-[rgba(147,161,161,0.15)]"
                        >
                          <Tag className="h-3 w-3 text-[#2aa198]" />
                          <span>{tag}</span>
                          <span className="rounded bg-[#073642] px-1.5 py-0.2 text-[10px] font-mono text-[#2aa198]">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#586e75]">Nenhuma tag cadastrada nas notas.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Chat Analítico com Dados do Workspace */
            <div className="space-y-4">
              <div className="rounded-xl border border-[#2aa198]/30 bg-[#073642]/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#2aa198] text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  <span>Pergunte qualquer coisa sobre suas notas e planilhas</span>
                </div>
                <p className="text-xs text-[#93a1a1]">
                  O Gemini analisa em tempo real o conteúdo de todas as notas, dados tabulares e tarefas pendentes.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleRunAiAnalysis("Quais são as principais tarefas pendentes em todas as notas?")}
                    className="rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-2.5 py-1 text-[11px] text-[#eee8d5] hover:border-[#2aa198] transition-colors"
                  >
                    📝 Resumir tarefas pendentes
                  </button>
                  <button
                    onClick={() => handleRunAiAnalysis("Faça um resumo executivo dos tópicos de todas as notas ativas.")}
                    className="rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-2.5 py-1 text-[11px] text-[#eee8d5] hover:border-[#2aa198] transition-colors"
                  >
                    📊 Resumo executivo geral
                  </button>
                  <button
                    onClick={() => handleRunAiAnalysis("Analise os dados numéricos e planilhas e aponte oportunidades de organização.")}
                    className="rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-2.5 py-1 text-[11px] text-[#eee8d5] hover:border-[#2aa198] transition-colors"
                  >
                    🔢 Análise de planilhas e números
                  </button>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunAiAnalysis();
                  }}
                  placeholder="Ex: 'Quais notas tratam de orçamento?' ou 'Some os valores das tarefas'..."
                  className="flex-1 rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-4 py-2.5 text-xs text-[#eee8d5] placeholder-[#586e75] outline-none focus:border-[#2aa198]"
                />
                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={isAiLoading || !chatPrompt.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2aa198] px-4 py-2.5 text-xs font-semibold text-[#002b36] shadow hover:bg-[#2aa198]/90 disabled:opacity-50 transition-colors"
                >
                  {isAiLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Consultar</span>
                </button>
              </div>

              {/* Chat Error */}
              {chatError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                  {chatError}
                </div>
              )}

              {/* AI Response Display */}
              {chatResponse && (
                <div className="rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#073642] p-4 text-xs text-[#eee8d5] space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] pb-2 text-[11px] text-[#2aa198] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Análise do Gemini
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-[#eee8d5]">
                    {chatResponse}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#073642]/60 px-5 py-3 text-xs text-[#93a1a1]">
          <span>{metrics.totalNotes} notas indexadas em tempo real</span>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-3 py-1.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Métricas (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
