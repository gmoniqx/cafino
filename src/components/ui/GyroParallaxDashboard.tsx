"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OrientationPermissionState = "unknown" | "granted" | "denied" | "unsupported";

type FloatingLayer = {
  id: string;
  label: string;
  depth: number;
  positionClass: string;
};

const LAYERS: FloatingLayer[] = [
  {
    id: "bg-ring",
    label: "Background ring",
    depth: 0.3,
    positionClass:
      "left-[8%] top-[12%] h-28 w-28 rounded-full border border-white/55 bg-white/30 backdrop-blur-sm",
  },
  {
    id: "cloud",
    label: "Cloud widget",
    depth: 0.55,
    positionClass: "right-[12%] top-[14%]",
  },
  {
    id: "chart",
    label: "Chart widget",
    depth: 0.9,
    positionClass: "left-[16%] bottom-[18%]",
  },
  {
    id: "coin",
    label: "Coin icon",
    depth: 1.25,
    positionClass: "right-[14%] bottom-[22%]",
  },
  {
    id: "foreground",
    label: "Foreground orb",
    depth: 1.6,
    positionClass:
      "left-1/2 top-[45%] h-20 w-20 -translate-x-1/2 rounded-full bg-gradient-to-br from-[var(--cafino-soft-strong)] to-[var(--cafino-accent)] shadow-2xl",
  },
];

type CaffeineState = "normal" | "high" | "over";
type TrendState = "up" | "flat" | "down";

interface GyroParallaxDashboardProps {
  title?: string;
  className?: string;
  summaryLabel?: string;
  summaryValue?: string;
  summaryHint?: string;
  cloudText?: string;
  chartText?: string;
  coinText?: string;
  caffeineState?: CaffeineState;
  trendState?: TrendState;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function GyroParallaxDashboard({
  title = "Motion Dashboard",
  className,
  summaryLabel = "Daily Summary",
  summaryValue = "78%",
  summaryHint = "Engagement trending upward",
  cloudText = "Cloud Sync",
  chartText = "+12.4% Growth",
  coinText = "$",
  caffeineState = "normal",
  trendState = "up",
}: GyroParallaxDashboardProps) {
  const [permission, setPermission] = useState<OrientationPermissionState>("unknown");
  const [isListening, setIsListening] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const rafRef = useRef<number | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  const iosRequiresPermission = useMemo(() => {
    if (typeof window === "undefined") return false;

    const api = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<"granted" | "denied">;
        })
      | undefined;

    return typeof api?.requestPermission === "function";
  }, []);

  useEffect(() => {
    if (!isListening) return;

    const onOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const clampedBeta = clamp(beta, -45, 45);
      const clampedGamma = clamp(gamma, -45, 45);

      targetRef.current = {
        x: (clampedGamma / 45) * 16,
        y: (clampedBeta / 45) * 16,
      };
    };

    const animate = () => {
      const ease = 0.14;
      currentRef.current = {
        x: currentRef.current.x + (targetRef.current.x - currentRef.current.x) * ease,
        y: currentRef.current.y + (targetRef.current.y - currentRef.current.y) * ease,
      };

      setOffset(currentRef.current);
      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("deviceorientation", onOrientation);
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isListening]);

  const enableGyroscope = async () => {
    if (typeof window === "undefined") return;

    const api = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<"granted" | "denied">;
        })
      | undefined;

    if (!window.DeviceOrientationEvent) {
      setPermission("unsupported");
      return;
    }

    if (typeof api?.requestPermission === "function") {
      try {
        const result = await api.requestPermission();
        if (result === "granted") {
          setPermission("granted");
          setIsListening(true);
        } else {
          setPermission("denied");
          setIsListening(false);
        }
      } catch {
        setPermission("denied");
        setIsListening(false);
      }
      return;
    }

    setPermission("granted");
    setIsListening(true);
  };

  const cloudToneClass =
    caffeineState === "over"
      ? "border-red-200 bg-red-50/90 text-red-700"
      : caffeineState === "high"
        ? "border-amber-200 bg-amber-50/90 text-amber-700"
        : "border-emerald-200 bg-emerald-50/85 text-emerald-700";

  const chartToneClass =
    trendState === "down"
      ? "border-red-200 bg-red-50/90 text-red-700"
      : trendState === "flat"
        ? "border-zinc-200 bg-zinc-50/90 text-zinc-700"
        : "border-emerald-200 bg-emerald-50/90 text-emerald-700";

  const coinToneClass =
    caffeineState === "over"
      ? "bg-red-500"
      : caffeineState === "high"
        ? "bg-amber-500"
        : "bg-[var(--cafino-accent)]";

  const cloudIcon = caffeineState === "over" ? "!" : caffeineState === "high" ? "~" : "✓";
  const trendIcon = trendState === "down" ? "↓" : trendState === "flat" ? "→" : "↑";

  return (
    <section className={`w-full ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="cafino-title-lg text-[var(--cafino-text)]">{title}</h2>
        <button
          onClick={enableGyroscope}
          className="rounded-xl bg-[var(--cafino-accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--cafino-accent-strong)]"
        >
          {isListening ? "Gyro Active" : "Enable Gyro"}
        </button>
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-3xl border border-[var(--cafino-border)] bg-[color-mix(in_oklab,var(--cafino-soft)_85%,white)] p-6 shadow-[0_16px_34px_rgba(43,31,18,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklab,var(--cafino-soft)_55%,white),transparent_42%)]" />

        <div className="relative z-10 rounded-2xl border border-[var(--cafino-border)] bg-white/80 p-4 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--cafino-text-muted)]">{summaryLabel}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--cafino-text)]">{summaryValue}</p>
          <p className="mt-1 text-sm text-[var(--cafino-text-soft)]">{summaryHint}</p>
        </div>

        {LAYERS.map((layer) => {
          const x = offset.x * layer.depth;
          const y = offset.y * layer.depth;
          const layerClass =
            layer.id === "cloud"
              ? `${layer.positionClass} rounded-2xl border px-4 py-2 text-sm font-semibold shadow-lg ${cloudToneClass}`
              : layer.id === "chart"
                ? `${layer.positionClass} rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl ${chartToneClass}`
                : layer.id === "coin"
                  ? `${layer.positionClass} flex h-14 w-14 items-center justify-center rounded-full text-xl text-white shadow-xl ${coinToneClass}`
                  : layer.positionClass;

          return (
            <div
              key={layer.id}
              aria-label={layer.label}
              className={`absolute transition-transform duration-200 ease-out ${layerClass}`}
              style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
            >
              {layer.id === "cloud" ? `${cloudIcon} ${cloudText}` : null}
              {layer.id === "chart" ? `${trendIcon} ${chartText}` : null}
              {layer.id === "coin" ? coinText : null}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-[var(--cafino-text-soft)]">
        {permission === "unsupported" && "DeviceOrientation is not supported on this device/browser."}
        {permission === "denied" && "Motion permission denied. Allow motion access in browser settings and try again."}
        {permission === "unknown" && iosRequiresPermission && "iOS requires tapping Enable Gyro before motion data is available."}
        {permission === "granted" && "Tilt your device to see layered parallax depth in action."}
        {permission === "unknown" && !iosRequiresPermission && "Tap Enable Gyro, then tilt your device to see the parallax effect."}
      </p>
    </section>
  );
}
