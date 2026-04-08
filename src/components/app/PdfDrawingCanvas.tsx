import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type DrawingTool = "highlighter" | "pencil" | "pen" | "eraser" | "none";

export interface DrawingStroke {
  tool: DrawingTool;
  color: string;
  lineWidth: number;
  opacity: number;
  points: { x: number; y: number }[];
}

interface PdfDrawingCanvasProps {
  width: number;
  height: number;
  activeTool: DrawingTool;
  activeColor: string;
  strokes: DrawingStroke[];
  onStrokesChange: (strokes: DrawingStroke[]) => void;
}

const TOOL_CONFIG: Record<string, { lineWidth: number; opacity: number }> = {
  highlighter: { lineWidth: 20, opacity: 0.35 },
  pencil: { lineWidth: 1.5, opacity: 1 },
  pen: { lineWidth: 3, opacity: 1 },
  eraser: { lineWidth: 24, opacity: 1 },
};

export default function PdfDrawingCanvas({
  width,
  height,
  activeTool,
  activeColor,
  strokes,
  onStrokesChange,
}: PdfDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Redraw all strokes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw, width, height]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "none") return;
    e.preventDefault();
    const pos = getPos(e);
    const config = TOOL_CONFIG[activeTool] || TOOL_CONFIG.pen;
    currentStrokeRef.current = {
      tool: activeTool,
      color: activeColor,
      lineWidth: config.lineWidth,
      opacity: config.opacity,
      points: [pos],
    };
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const pos = getPos(e);
    currentStrokeRef.current.points.push(pos);

    // Live draw current stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stroke = currentStrokeRef.current;
    const pts = stroke.points;
    if (pts.length < 2) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStrokeRef.current) return;
    if (currentStrokeRef.current.points.length >= 2) {
      onStrokesChange([...strokes, currentStrokeRef.current]);
    }
    currentStrokeRef.current = null;
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        "absolute inset-0",
        activeTool === "none" ? "pointer-events-none" : "z-10",
        activeTool === "highlighter" && "cursor-cell",
        activeTool === "pencil" && "cursor-crosshair",
        activeTool === "pen" && "cursor-crosshair",
        activeTool === "eraser" && "cursor-not-allowed"
      )}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
