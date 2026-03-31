"use client";

import { removeBackground } from "@imgly/background-removal";
import { type ChangeEvent, useEffect, useState } from "react";

const DEFAULT_CUP_IMAGES = [
  "/espresso.png",
  "/americano.png",
  "/latte.png",
  "/cappuccino.png",
  "/mocha.png",
  "/matcha.png",
  "/signature.png",
] as const;

type StickerSource = "default" | "upload";

interface CupStickerUploaderProps {
  className?: string;
  onStickerReady?: (stickerUrl: string | null) => void;
  initialStickerUrl?: string | null;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image."));
    };
    image.src = objectUrl;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create PNG blob."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

async function isolateCupFromTransparentForeground(inputBlob: Blob): Promise<Blob> {
  const image = await loadImageFromBlob(inputBlob);
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not initialize canvas context.");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const total = width * height;
  const alphaThreshold = 20;

  const occupied = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) {
    occupied[i] = pixels[i * 4 + 3] > alphaThreshold ? 1 : 0;
  }

  const visited = new Uint8Array(total);
  const largestMask = new Uint8Array(total);
  let largestSize = 0;
  let largestMinX = width;
  let largestMinY = height;
  let largestMaxX = 0;
  let largestMaxY = 0;

  const queue = new Int32Array(total);

  for (let i = 0; i < total; i += 1) {
    if (!occupied[i] || visited[i]) {
      continue;
    }

    let qHead = 0;
    let qTail = 0;
    queue[qTail++] = i;
    visited[i] = 1;

    const component: number[] = [];
    let componentSize = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    while (qHead < qTail) {
      const current = queue[qHead++];
      component.push(current);
      componentSize += 1;

      const x = current % width;
      const y = Math.floor(current / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = current - 1;
      const right = current + 1;
      const up = current - width;
      const down = current + width;

      if (x > 0 && occupied[left] && !visited[left]) {
        visited[left] = 1;
        queue[qTail++] = left;
      }
      if (x < width - 1 && occupied[right] && !visited[right]) {
        visited[right] = 1;
        queue[qTail++] = right;
      }
      if (y > 0 && occupied[up] && !visited[up]) {
        visited[up] = 1;
        queue[qTail++] = up;
      }
      if (y < height - 1 && occupied[down] && !visited[down]) {
        visited[down] = 1;
        queue[qTail++] = down;
      }
    }

    if (componentSize > largestSize) {
      largestSize = componentSize;
      largestMask.fill(0);
      for (const idx of component) {
        largestMask[idx] = 1;
      }
      largestMinX = minX;
      largestMinY = minY;
      largestMaxX = maxX;
      largestMaxY = maxY;
    }
  }

  if (largestSize === 0) {
    return inputBlob;
  }

  for (let i = 0; i < total; i += 1) {
    if (!largestMask[i]) {
      pixels[i * 4 + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const padding = 14;
  const cropX = Math.max(0, largestMinX - padding);
  const cropY = Math.max(0, largestMinY - padding);
  const cropW = Math.min(width - cropX, largestMaxX - largestMinX + 1 + padding * 2);
  const cropH = Math.min(height - cropY, largestMaxY - largestMinY + 1 + padding * 2);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = cropW;
  outCanvas.height = cropH;

  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) {
    throw new Error("Could not initialize output canvas context.");
  }

  outCtx.clearRect(0, 0, cropW, cropH);
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return canvasToPngBlob(outCanvas);
}

export default function CupStickerUploader({
  className,
  onStickerReady,
  initialStickerUrl = DEFAULT_CUP_IMAGES[0],
}: CupStickerUploaderProps) {
  const [source, setSource] = useState<StickerSource>("default");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDefault, setSelectedDefault] = useState<string>(DEFAULT_CUP_IMAGES[0]);
  const [stickerUrl, setStickerUrl] = useState<string | null>(initialStickerUrl);
  const [generatedObjectUrl, setGeneratedObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    onStickerReady?.(stickerUrl);
  }, [onStickerReady, stickerUrl]);

  useEffect(() => {
    return () => {
      if (generatedObjectUrl) {
        URL.revokeObjectURL(generatedObjectUrl);
      }
    };
  }, [generatedObjectUrl]);

  const onSelectDefault = (url: string) => {
    setSource("default");
    setSelectedDefault(url);
    setError(null);
    setStickerUrl(url);
    if (generatedObjectUrl) {
      URL.revokeObjectURL(generatedObjectUrl);
      setGeneratedObjectUrl(null);
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSource("upload");
    setProcessing(true);
    setError(null);

    try {
      const removed = await removeBackground(file);
      const removedBlob = removed instanceof Blob ? removed : new Blob([removed], { type: "image/png" });

      // Keep only the largest non-transparent subject so the output focuses on the cup.
      const cupOnlyBlob = await isolateCupFromTransparentForeground(removedBlob);
      const nextUrl = URL.createObjectURL(cupOnlyBlob);

      if (generatedObjectUrl) {
        URL.revokeObjectURL(generatedObjectUrl);
      }

      setGeneratedObjectUrl(nextUrl);
      setStickerUrl(nextUrl);
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Unable to generate cup sticker.");
      setStickerUrl(selectedDefault);
      setSource("default");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <div className={`w-full rounded-3xl border border-[var(--cafino-border)] bg-white p-4 ${className ?? ""}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSource("default")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
            source === "default" ? "bg-[var(--cafino-accent)] text-white" : "bg-[var(--cafino-soft-alt)] text-[var(--cafino-text)]"
          }`}
        >
          Default Cups
        </button>
        <label
          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
            source === "upload" ? "bg-[var(--cafino-accent)] text-white" : "bg-[var(--cafino-soft-alt)] text-[var(--cafino-text)]"
          }`}
        >
          Upload Cup Image
          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </label>
      </div>

      {source === "default" ? (
        <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DEFAULT_CUP_IMAGES.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelectDefault(url)}
              className={`overflow-hidden rounded-xl border bg-[var(--cafino-surface-2)] p-1 ${
                selectedDefault === url ? "border-[var(--cafino-accent)]" : "border-[var(--cafino-border)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Default cup" className="h-14 w-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)]/60 p-4">
        {processing ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-[var(--cafino-text)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cafino-border)] border-t-[var(--cafino-accent)]" />
            Removing background...
          </div>
        ) : null}

        {!processing && stickerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stickerUrl}
            alt="Cup sticker preview"
            className="max-h-48 w-auto object-contain [filter:drop-shadow(0_0_2px_white)_drop-shadow(0_0_2px_white)_drop-shadow(0_0_2px_white)_drop-shadow(0_4px_6px_rgba(0,0,0,0.14))]"
          />
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <p className="mt-2 text-xs text-[var(--cafino-text-muted)]">
        Tip: upload a clear photo where the cup is the main subject for best cup-only sticker extraction.
      </p>
    </div>
  );
}
