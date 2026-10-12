"use client";

import { useCallback, useEffect, useRef } from "react";

type SignaturePadProps = {
  onChange: (file: File | null) => void;
  className?: string;
};

export const SignaturePad = ({ onChange, className }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const exportFile = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onChange(null);
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        onChange(null);
        return;
      }
      onChange(new File([blob], "signature.png", { type: "image/png" }));
    }, "image/png");
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1a1a1a";
    context.lineWidth = 2;
    context.lineCap = "round";
  }, []);

  const pointerPos = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={480}
        height={160}
        className="h-40 w-full touch-none rounded-xl border border-border bg-white"
        onPointerDown={(event) => {
          drawingRef.current = true;
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!context) {
            return;
          }
          const { x, y } = pointerPos(event);
          context.beginPath();
          context.moveTo(x, y);
          canvas?.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current) {
            return;
          }
          const context = canvasRef.current?.getContext("2d");
          if (!context) {
            return;
          }
          const { x, y } = pointerPos(event);
          context.lineTo(x, y);
          context.stroke();
        }}
        onPointerUp={() => {
          drawingRef.current = false;
          exportFile();
        }}
        onPointerLeave={() => {
          if (drawingRef.current) {
            drawingRef.current = false;
            exportFile();
          }
        }}
      />
      <button
        type="button"
        className="mt-2 text-xs font-medium text-brand hover:underline"
        onClick={() => {
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!canvas || !context) {
            return;
          }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          onChange(null);
        }}
      >
        Clear signature
      </button>
    </div>
  );
};
