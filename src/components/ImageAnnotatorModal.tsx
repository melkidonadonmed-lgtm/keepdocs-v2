import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  PenTool,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Upload,
  Sparkles,
  Check,
  Share2,
  Trash2,
  Grid,
  AlignLeft,
  Sun,
  Moon,
} from "lucide-react";
import { ImageAnnotationLayer, Note } from "../types";
import { EditorHeader } from "./EditorHeader";
import { GhostButton } from "./GhostButton";
import { ShareModal } from "./ShareModal";

interface ImageAnnotatorModalProps {
  note?: Note | null;
  onClose: () => void;
  onSaveAsNote: (note: Note) => void;
}

type CanvasBgType = "dark" | "light" | "ruled" | "grid" | "image";

export const ImageAnnotatorModal: React.FC<ImageAnnotatorModalProps> = ({
  note,
  onClose,
  onSaveAsNote,
}) => {
  const [title, setTitle] = useState(note?.title || "Anotação Livre em Canvas");
  const [selectedTool, setSelectedTool] = useState<
    "pen" | "highlighter" | "eraser" | "rect" | "circle" | "arrow" | "text"
  >("pen");
  const [color, setColor] = useState<string>("#2aa198");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [bgType, setBgType] = useState<CanvasBgType>(
    note?.imageAnnotation?.base64Image?.startsWith("data:image") ? "image" : "dark"
  );
  const [bgImage, setBgImage] = useState<string>(note?.imageAnnotation?.base64Image || "");
  const [layers, setLayers] = useState<ImageAnnotationLayer[]>(note?.imageAnnotation?.layers || []);
  const [undoStack, setUndoStack] = useState<ImageAnnotationLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<ImageAnnotationLayer[][]>([]);
  
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  
  const [textInputVal, setTextInputVal] = useState<string>("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [aiImagePrompt, setAiImagePrompt] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Scaled Coordinate Calculation for accurate touch on mobile and high-DPI screens
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Redraw Canvas on layers, background, or current path changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    if (bgType === "image" && bgImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        renderLayersAndCurrent(ctx);
      };
      img.src = bgImage;
      return;
    }

    if (bgType === "light") {
      ctx.fillStyle = "#fdf6e3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#002b36";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Ruled Lines background (Keep-style notebook lines)
    if (bgType === "ruled") {
      ctx.strokeStyle = bgType === "light" ? "rgba(101,123,131,0.2)" : "rgba(147,161,161,0.15)";
      ctx.lineWidth = 1;
      const lineGap = 32;
      for (let y = lineGap; y < canvas.height; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (bgType === "grid") {
      ctx.strokeStyle = bgType === "light" ? "rgba(101,123,131,0.15)" : "rgba(147,161,161,0.1)";
      ctx.lineWidth = 1;
      const gridGap = 24;
      for (let x = gridGap; x < canvas.width; x += gridGap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = gridGap; y < canvas.height; y += gridGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    renderLayersAndCurrent(ctx);
  }, [layers, currentPath, isDrawing, bgType, bgImage, selectedTool, color, strokeWidth, startPos]);

  const renderLayersAndCurrent = (ctx: CanvasRenderingContext2D) => {
    // Draw all committed layers
    layers.forEach((layer) => {
      drawSingleLayer(ctx, layer);
    });

    // Draw active drawing path / preview shape in real-time
    if (isDrawing) {
      if ((selectedTool === "pen" || selectedTool === "highlighter") && currentPath.length > 1) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = selectedTool === "highlighter" ? 0.35 : 1.0;

        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (startPos && currentPath.length > 0) {
        const lastPt = currentPath[currentPath.length - 1];
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.setLineDash([4, 4]);

        if (selectedTool === "rect") {
          ctx.strokeRect(startPos.x, startPos.y, lastPt.x - startPos.x, lastPt.y - startPos.y);
        } else if (selectedTool === "circle") {
          const radius = Math.sqrt(Math.pow(lastPt.x - startPos.x, 2) + Math.pow(lastPt.y - startPos.y, 2));
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (selectedTool === "arrow") {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(lastPt.x, lastPt.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }
  };

  const drawSingleLayer = (ctx: CanvasRenderingContext2D, layer: ImageAnnotationLayer) => {
    ctx.strokeStyle = layer.color;
    ctx.fillStyle = layer.color;
    ctx.lineWidth = layer.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (layer.type === "pen" || layer.type === "highlighter") {
      ctx.globalAlpha = layer.type === "highlighter" ? 0.35 : 1.0;
      if (layer.points && layer.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(layer.points[0].x, layer.points[0].y);
        for (let i = 1; i < layer.points.length; i++) {
          ctx.lineTo(layer.points[i].x, layer.points[i].y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    } else if (layer.type === "rect" && layer.x !== undefined && layer.y !== undefined && layer.x2 !== undefined && layer.y2 !== undefined) {
      ctx.strokeRect(layer.x, layer.y, layer.x2 - layer.x, layer.y2 - layer.y);
    } else if (layer.type === "circle" && layer.x !== undefined && layer.y !== undefined && layer.x2 !== undefined && layer.y2 !== undefined) {
      const radius = Math.sqrt(Math.pow(layer.x2 - layer.x, 2) + Math.pow(layer.y2 - layer.y, 2));
      ctx.beginPath();
      ctx.arc(layer.x, layer.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (layer.type === "arrow" && layer.x !== undefined && layer.y !== undefined && layer.x2 !== undefined && layer.y2 !== undefined) {
      const headlen = 15;
      const dx = layer.x2 - layer.x;
      const dy = layer.y2 - layer.y;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(layer.x, layer.y);
      ctx.lineTo(layer.x2, layer.y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(layer.x2, layer.y2);
      ctx.lineTo(layer.x2 - headlen * Math.cos(angle - Math.PI / 6), layer.y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(layer.x2 - headlen * Math.cos(angle + Math.PI / 6), layer.y2 - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (layer.type === "text" && layer.text && layer.x !== undefined && layer.y !== undefined) {
      ctx.font = `bold ${Math.max(layer.width * 5, 14)}px sans-serif`;
      ctx.fillText(layer.text, layer.x, layer.y);
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Unified Pointer / Touch Action Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (selectedTool === "text") {
      setTextPos({ x, y });
      return;
    }

    if (selectedTool === "eraser") {
      // Erase nearest layer
      eraseLayerAt(x, y);
      setIsDrawing(true);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPath([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (selectedTool === "eraser") {
      eraseLayerAt(x, y);
      return;
    }

    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing && selectedTool !== "text") return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    setIsDrawing(false);

    if (selectedTool === "eraser" || selectedTool === "text") {
      setStartPos(null);
      setCurrentPath([]);
      return;
    }

    const { x: endX, y: endY } = getCanvasCoords(e.clientX, e.clientY);
    let newLayer: ImageAnnotationLayer | null = null;

    if (selectedTool === "pen" || selectedTool === "highlighter") {
      if (currentPath.length > 1) {
        newLayer = {
          id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: selectedTool,
          color,
          width: strokeWidth,
          points: currentPath,
        };
      }
    } else if (selectedTool === "rect" && startPos) {
      newLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: "rect",
        color,
        width: strokeWidth,
        x: startPos.x,
        y: startPos.y,
        x2: endX,
        y2: endY,
      };
    } else if (selectedTool === "circle" && startPos) {
      newLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: "circle",
        color,
        width: strokeWidth,
        x: startPos.x,
        y: startPos.y,
        x2: endX,
        y2: endY,
      };
    } else if (selectedTool === "arrow" && startPos) {
      newLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: "arrow",
        color,
        width: strokeWidth,
        x: startPos.x,
        y: startPos.y,
        x2: endX,
        y2: endY,
      };
    }

    if (newLayer) {
      setUndoStack((prev) => [...prev, layers]);
      setRedoStack([]);
      setLayers((prev) => [...prev, newLayer!]);
    }

    setStartPos(null);
    setCurrentPath([]);
  };

  // Helper: Distância geométrica de um ponto (px, py) a um segmento de reta (x1, y1) - (x2, y2)
  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const eraseLayerAt = (x: number, y: number) => {
    const baseRadius = Math.max(strokeWidth * 4, 24);
    const remaining = layers.filter((layer) => {
      // 1. Caneta e Marca-texto (percorre segmentos de linhas do traço)
      if (layer.points && layer.points.length > 0) {
        if (layer.points.length === 1) {
          return Math.hypot(layer.points[0].x - x, layer.points[0].y - y) >= baseRadius;
        }
        for (let i = 0; i < layer.points.length - 1; i++) {
          const d = distToSegment(
            x,
            y,
            layer.points[i].x,
            layer.points[i].y,
            layer.points[i + 1].x,
            layer.points[i + 1].y
          );
          if (d < baseRadius + (layer.width || 3) / 2) {
            return false; // Apaga o traço
          }
        }
        return true;
      }

      // 2. Retângulos (verifica bordas e clique interno)
      if (
        layer.type === "rect" &&
        layer.x !== undefined &&
        layer.y !== undefined &&
        layer.x2 !== undefined &&
        layer.y2 !== undefined
      ) {
        const xMin = Math.min(layer.x, layer.x2);
        const xMax = Math.max(layer.x, layer.x2);
        const yMin = Math.min(layer.y, layer.y2);
        const yMax = Math.max(layer.y, layer.y2);

        const d1 = distToSegment(x, y, xMin, yMin, xMax, yMin);
        const d2 = distToSegment(x, y, xMax, yMin, xMax, yMax);
        const d3 = distToSegment(x, y, xMax, yMax, xMin, yMax);
        const d4 = distToSegment(x, y, xMin, yMax, xMin, yMin);
        const minBorderDist = Math.min(d1, d2, d3, d4);

        if (minBorderDist < baseRadius || (x >= xMin && x <= xMax && y >= yMin && y <= yMax)) {
          return false;
        }
        return true;
      }

      // 3. Círculos (verifica raio e área interna)
      if (
        layer.type === "circle" &&
        layer.x !== undefined &&
        layer.y !== undefined &&
        layer.x2 !== undefined &&
        layer.y2 !== undefined
      ) {
        const radius = Math.hypot(layer.x2 - layer.x, layer.y2 - layer.y);
        const distFromCenter = Math.hypot(x - layer.x, y - layer.y);
        if (Math.abs(distFromCenter - radius) < baseRadius || distFromCenter <= radius) {
          return false;
        }
        return true;
      }

      // 4. Setas indicativas
      if (
        layer.type === "arrow" &&
        layer.x !== undefined &&
        layer.y !== undefined &&
        layer.x2 !== undefined &&
        layer.y2 !== undefined
      ) {
        const d = distToSegment(x, y, layer.x, layer.y, layer.x2, layer.y2);
        if (d < baseRadius + (layer.width || 3)) {
          return false;
        }
        return true;
      }

      // 5. Textos anotados
      if (layer.type === "text" && layer.x !== undefined && layer.y !== undefined) {
        const fontSize = Math.max((layer.width || 3) * 5, 14);
        const approxWidth = (layer.text?.length || 5) * (fontSize * 0.6);
        if (
          x >= layer.x - baseRadius &&
          x <= layer.x + approxWidth + baseRadius &&
          y >= layer.y - fontSize - baseRadius &&
          y <= layer.y + baseRadius
        ) {
          return false;
        }
        return true;
      }

      return true;
    });

    if (remaining.length !== layers.length) {
      setUndoStack((prev) => [...prev, layers]);
      setRedoStack([]);
      setLayers(remaining);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, layers]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setLayers(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, layers]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setLayers(next);
  };

  const handleClearAll = () => {
    if (layers.length === 0) return;
    if (window.confirm("Limpar todo o desenho da tela?")) {
      setUndoStack((prev) => [...prev, layers]);
      setRedoStack([]);
      setLayers([]);
    }
  };

  const handleAddTextLayer = () => {
    if (!textPos || !textInputVal.trim()) {
      setTextPos(null);
      setTextInputVal("");
      return;
    }

    const newLayer: ImageAnnotationLayer = {
      id: `layer_${Date.now()}`,
      type: "text",
      color,
      width: strokeWidth,
      text: textInputVal,
      x: textPos.x,
      y: textPos.y,
    };

    setUndoStack((prev) => [...prev, layers]);
    setRedoStack([]);
    setLayers((prev) => [...prev, newLayer]);
    setTextPos(null);
    setTextInputVal("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor envie um arquivo de imagem válido.");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === "string") {
        setBgImage(loadEvt.target.result);
        setBgType("image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGeminiGenerateImage = async () => {
    if (!aiImagePrompt.trim()) return;

    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiImagePrompt }),
      });

      if (!res.ok) {
        throw new Error("Falha ao gerar imagem.");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setBgImage(data.imageUrl);
        setBgType("image");
      }
    } catch (err: any) {
      setUploadError("Erro ao gerar imagem com IA.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const finalDataUrl = canvas ? canvas.toDataURL("image/png") : bgImage;

    const newNote: Note = {
      id: note ? note.id : "canvas_note_" + Date.now(),
      title: title || "Anotação Livre em Canvas",
      content: `<p>Anotação visual em canvas com ${layers.length} camadas desenhadas.</p>`,
      type: "canvas",
      color: "purple",
      tags: ["Canvas", "Desenho", "Keep"],
      pinned: note ? note.pinned : false,
      archived: false,
      trashed: false,
      createdAt: note ? note.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageAnnotation: {
        base64Image: finalDataUrl,
        layers,
      },
    };
    onSaveAsNote(newNote);
    onClose();
  };

  const currentNoteForShare: Note = {
    id: note ? note.id : "temp_canvas",
    title: title || "Anotação Livre em Canvas",
    content: `<p>Anotação visual em canvas com ${layers.length} camadas desenhadas.</p>`,
    type: "canvas",
    color: "purple",
    tags: ["Canvas", "Desenho"],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageAnnotation: {
      base64Image: canvasRef.current?.toDataURL("image/png") || bgImage,
      layers,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060e12]/85 p-1 sm:p-4 backdrop-blur-xs">
      <div className="relative flex h-full max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#0e1b22] shadow-2xl">
        {/* Responsive Editor Header */}
        <EditorHeader
          icon={<PenTool className="h-5 w-5 text-[#6c71c4]" />}
          title={title}
          onTitleChange={setTitle}
          isTitleEditable={true}
          subtitle="Desenho livre no celular e computador com suporte a toque e camadas"
          actions={
            <>
              <GhostButton
                variant="ghost"
                onClick={() => setShowShareModal(true)}
                title="Compartilhar e Exportar Imagem (PNG, PDF, etc.)"
              >
                <Share2 className="h-3.5 w-3.5 text-[#268bd2]" />
                <span>Compartilhar</span>
              </GhostButton>

              <GhostButton
                variant="accent"
                onClick={handleSave}
                title="Salvar Anotação Canvas"
              >
                <Check className="h-4 w-4" />
                <span>Salvar Desenho</span>
              </GhostButton>
            </>
          }
          onClose={onClose}
        />

        {/* Share Modal */}
        <ShareModal
          note={currentNoteForShare}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Mobile-First Responsive Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(147,161,161,0.15)] bg-[#122129] px-3 py-2 sm:px-5">
          {/* Tools Selector */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            <GhostButton
              size="icon"
              variant={selectedTool === "pen" ? "active" : "ghost"}
              onClick={() => setSelectedTool("pen")}
              title="Caneta Lápis"
              className="h-8 w-8 rounded-[8px]"
            >
              <PenTool className="h-4 w-4" />
            </GhostButton>

            <GhostButton
              size="icon"
              variant={selectedTool === "highlighter" ? "active" : "ghost"}
              onClick={() => setSelectedTool("highlighter")}
              title="Marca-Texto"
              className="h-8 w-8 rounded-[8px]"
            >
              <Highlighter className="h-4 w-4" />
            </GhostButton>

            <GhostButton
              size="icon"
              variant={selectedTool === "eraser" ? "active" : "ghost"}
              onClick={() => setSelectedTool("eraser")}
              title="Borracha (apagar traços)"
              className="h-8 w-8 rounded-[8px]"
            >
              <Eraser className="h-4 w-4 text-[#dc322f]" />
            </GhostButton>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-0.5" />

            <GhostButton
              size="icon"
              variant={selectedTool === "rect" ? "active" : "ghost"}
              onClick={() => setSelectedTool("rect")}
              title="Retângulo"
              className="h-8 w-8 rounded-[8px]"
            >
              <Square className="h-3.5 w-3.5" />
            </GhostButton>

            <GhostButton
              size="icon"
              variant={selectedTool === "circle" ? "active" : "ghost"}
              onClick={() => setSelectedTool("circle")}
              title="Círculo"
              className="h-8 w-8 rounded-[8px]"
            >
              <Circle className="h-3.5 w-3.5" />
            </GhostButton>

            <GhostButton
              size="icon"
              variant={selectedTool === "arrow" ? "active" : "ghost"}
              onClick={() => setSelectedTool("arrow")}
              title="Seta Indicativa"
              className="h-8 w-8 rounded-[8px]"
            >
              <MoveRight className="h-3.5 w-3.5" />
            </GhostButton>

            <GhostButton
              size="icon"
              variant={selectedTool === "text" ? "active" : "ghost"}
              onClick={() => setSelectedTool("text")}
              title="Inserir Texto"
              className="h-8 w-8 rounded-[8px]"
            >
              <Type className="h-3.5 w-3.5" />
            </GhostButton>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-0.5" />

            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] disabled:opacity-30"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] disabled:opacity-30"
              title="Refazer (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <button
              onClick={handleClearAll}
              disabled={layers.length === 0}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#dc322f]/15 hover:text-[#dc322f] disabled:opacity-30"
              title="Limpar tela inteira"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Color Palette & Stroke Width */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              {["#2aa198", "#268bd2", "#859900", "#b58900", "#dc322f", "#6c71c4", "#eee8d5", "#002b36"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-4.5 w-4.5 rounded-full border border-white/20 transition-all ${
                    color === c ? "ring-2 ring-[#2aa198] scale-125" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  title={`Cor ${c}`}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)]" />

            {/* Stroke Width Slider */}
            <input
              type="range"
              min={1}
              max={16}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-14 sm:w-20 accent-[#2aa198]"
              title={`Espessura: ${strokeWidth}px`}
            />

            {/* Background Canvas Mode Selector (Keep style) */}
            <div className="flex items-center gap-1 rounded-lg bg-[#002b36] p-0.5 border border-[rgba(147,161,161,0.15)]">
              <button
                onClick={() => setBgType("dark")}
                className={`p-1 rounded ${bgType === "dark" ? "bg-[#2aa198] text-[#002b36]" : "text-[#93a1a1]"}`}
                title="Fundo Escuro"
              >
                <Moon className="h-3 w-3" />
              </button>
              <button
                onClick={() => setBgType("light")}
                className={`p-1 rounded ${bgType === "light" ? "bg-[#2aa198] text-[#002b36]" : "text-[#93a1a1]"}`}
                title="Fundo Claro"
              >
                <Sun className="h-3 w-3" />
              </button>
              <button
                onClick={() => setBgType("ruled")}
                className={`p-1 rounded ${bgType === "ruled" ? "bg-[#2aa198] text-[#002b36]" : "text-[#93a1a1]"}`}
                title="Caderno Pautado"
              >
                <AlignLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => setBgType("grid")}
                className={`p-1 rounded ${bgType === "grid" ? "bg-[#2aa198] text-[#002b36]" : "text-[#93a1a1]"}`}
                title="Papel Quadriculado"
              >
                <Grid className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Generator & Image Upload Bar */}
        <div className="flex items-center gap-2 border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/40 px-3 py-1.5 sm:px-5">
          <Sparkles className="h-3.5 w-3.5 text-[#2aa198] animate-pulse shrink-0" />
          <input
            type="text"
            value={aiImagePrompt}
            onChange={(e) => setAiImagePrompt(e.target.value)}
            placeholder="Gerar fundo com IA: Ex: 'diagrama de fluxo'..."
            className="flex-1 rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#002b36] px-2.5 py-1 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
          />
          <GhostButton
            variant="accent"
            disabled={isAiGenerating || !aiImagePrompt.trim()}
            onClick={handleGeminiGenerateImage}
            className="h-7 px-2.5 text-xs"
          >
            {isAiGenerating ? "Gerando..." : "Criar Imagem"}
          </GhostButton>

          <label className="flex cursor-pointer items-center gap-1 rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#002b36] px-2.5 py-1 text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors shrink-0">
            <Upload className="h-3 w-3 text-[#2aa198]" />
            <span className="hidden sm:inline">Upload</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {/* Main Canvas Drawing Stage */}
        <div
          ref={canvasContainerRef}
          className="relative flex flex-1 items-center justify-center overflow-auto p-2 sm:p-4 bg-[#002b36]/40 select-none"
          style={{ touchAction: "none" }}
        >
          <canvas
            ref={canvasRef}
            width={840}
            height={520}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full max-w-[840px] aspect-[840/520] rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] shadow-2xl touch-none ${
              selectedTool === "eraser" ? "cursor-cell" : "cursor-crosshair"
            }`}
            style={{ touchAction: "none" }}
          />

          {/* Text Input Overlay */}
          {textPos && (
            <div
              className="absolute z-20 flex items-center gap-1 rounded-xl border border-[#2aa198]/50 bg-[#073642] p-2 shadow-2xl"
              style={{ top: "40%", left: "50%", transform: "translate(-50%, -50%)" }}
            >
              <input
                type="text"
                autoFocus
                value={textInputVal}
                onChange={(e) => setTextInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTextLayer()}
                placeholder="Digite o texto aqui..."
                className="w-56 rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#002b36] px-2.5 py-1 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
              />
              <GhostButton
                variant="accent"
                onClick={handleAddTextLayer}
                className="h-7 px-2.5 text-xs"
              >
                Inserir
              </GhostButton>
              <button
                onClick={() => setTextPos(null)}
                className="rounded p-1 text-[#93a1a1] hover:text-[#eee8d5]"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Mobile touch status indicator */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-3 py-1.5 sm:px-5 text-[11px] text-[#586e75]">
          <span>{layers.length} traços desenhados • Toque livre habilitado para smartphone</span>
          <span className="hidden sm:inline">KeepDocs Visual Canvas</span>
        </div>
      </div>
    </div>
  );
};
