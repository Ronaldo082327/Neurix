import { useState, useEffect, useRef } from "react";
import { Star, HelpCircle, Highlighter, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "concept", label: "Conceito", icon: Star, bg: "bg-yellow-500/90 hover:bg-yellow-500" },
  { value: "doubt", label: "Dúvida", icon: HelpCircle, bg: "bg-orange-500/90 hover:bg-orange-500" },
  { value: "review", label: "Revisão", icon: Highlighter, bg: "bg-blue-500/90 hover:bg-blue-500" },
  { value: "trap", label: "Pegadinha", icon: AlertTriangle, bg: "bg-red-500/90 hover:bg-red-500" },
];

interface TextSelectionPopupProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onHighlight: (text: string, category: string) => void;
}

export default function TextSelectionPopup({ containerRef, onHighlight }: TextSelectionPopupProps) {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small delay to let selection finalize
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setPosition(null);
          setSelectedText("");
          return;
        }

        const text = selection.toString().trim();
        if (text.length < 3) return;

        // Check if selection is within the container
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if the selection anchor is inside the text layer
        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;
        const parentEl = anchorNode.parentElement;
        if (!parentEl || !container.contains(parentEl)) return;

        setSelectedText(text);
        setPosition({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top - 8,
        });
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node)) return;
      setPosition(null);
      setSelectedText("");
    };

    container.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef]);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={popupRef}
      className="absolute z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            title={cat.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHighlight(selectedText, cat.value);
              setPosition(null);
              setSelectedText("");
              window.getSelection()?.removeAllRanges();
            }}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-md text-white font-medium transition-all",
              cat.bg
            )}
          >
            <cat.icon className="h-3 w-3" />
            {cat.label}
          </button>
        ))}
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-2.5 h-2.5 bg-card/95 border-r border-b border-border/50 transform rotate-45 -mt-1.5" />
      </div>
    </div>
  );
}
