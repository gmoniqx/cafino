"use client";

import { Bodies, Body, Composite, Engine, World } from "matter-js";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CoffeeLog } from "@/features/cafino/store/useCafinoStore";

interface CoffeeSprite {
  id: string;
  src: string;
  label: string;
}

interface SpriteBody {
  body: Body;
  sprite: CoffeeSprite;
  radius: number;
}

interface AccelerometerCoffeePhysicsProps {
  logs: CoffeeLog[];
  className?: string;
  maxSprites?: number;
}

const TYPE_TO_ASSET: Record<string, string> = {
  espresso: "/espresso.png",
  latte: "/latte.png",
  cappuccino: "/cappuccino.png",
  americano: "/americano.png",
  mocha: "/mocha.png",
  matcha: "/matcha.png",
};

const DEFAULT_ASSETS = [
  "/espresso.png",
  "/latte.png",
  "/cappuccino.png",
  "/americano.png",
  "/mocha.png",
  "/matcha.png",
];

const WORLD_BOUNDARY_THICKNESS = 40;

// Increase this to make cup-to-cup and cup-to-wall collisions bouncier.
const CUP_RESTITUTION = 0.48;

// Increase this to make tilt have a stronger effect on world gravity.
const GRAVITY_SENSITIVITY = 0.14;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSpriteForLog(log: CoffeeLog, fallbackIndex: number): CoffeeSprite {
  if (log.photo) {
    return {
      id: log.id,
      src: log.photo,
      label: `${log.name} photo`,
    };
  }

  const normalizedType = log.type.trim().toLowerCase();
  const typedAsset = TYPE_TO_ASSET[normalizedType];
  return {
    id: log.id,
    src: typedAsset ?? DEFAULT_ASSETS[fallbackIndex % DEFAULT_ASSETS.length],
    label: log.name,
  };
}

export default function AccelerometerCoffeePhysics({
  logs,
  className,
  maxSprites = 18,
}: AccelerometerCoffeePhysicsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const spriteBodiesRef = useRef<SpriteBody[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [worldSize, setWorldSize] = useState({ width: 0, height: 0 });

  const [isMotionActive, setIsMotionActive] = useState(false);

  const spriteSources = useMemo(() => {
    const sorted = [...logs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const selected = sorted.slice(0, maxSprites);
    return selected.map((log, index) => getSpriteForLog(log, index));
  }, [logs, maxSprites]);

  useEffect(() => {
    const engine = Engine.create();
    engine.gravity.x = 0;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.001;
    engineRef.current = engine;

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      World.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      spriteBodiesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0];
      if (!next) return;

      const width = Math.max(1, Math.floor(next.contentRect.width));
      const height = Math.max(1, Math.floor(next.contentRect.height));

      setWorldSize((current) => {
        if (current.width === width && current.height === height) {
          return current;
        }

        return { width, height };
      });
    });

    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const { width, height } = worldSize;
    if (!engine || !canvas || width <= 0 || height <= 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    World.clear(engine.world, false);
    spriteBodiesRef.current = [];

    const walls = [
      Bodies.rectangle(width / 2, -WORLD_BOUNDARY_THICKNESS / 2, width, WORLD_BOUNDARY_THICKNESS, { isStatic: true }),
      Bodies.rectangle(width / 2, height + WORLD_BOUNDARY_THICKNESS / 2, width, WORLD_BOUNDARY_THICKNESS, { isStatic: true }),
      Bodies.rectangle(-WORLD_BOUNDARY_THICKNESS / 2, height / 2, WORLD_BOUNDARY_THICKNESS, height, { isStatic: true }),
      Bodies.rectangle(width + WORLD_BOUNDARY_THICKNESS / 2, height / 2, WORLD_BOUNDARY_THICKNESS, height, { isStatic: true }),
    ];

    Composite.add(engine.world, walls);

    const addDynamicSprite = (sprite: CoffeeSprite, index: number) => {
      const radius = 20 + (index % 3) * 6;
      const spawnX = 44 + ((index * 38) % Math.max(44, width - 88));
      const spawnY = 38 + ((index * 16) % Math.max(40, Math.floor(height * 0.24)));

      const body = Bodies.circle(spawnX, spawnY, radius, {
        mass: 1,
        friction: 0.04,
        frictionAir: 0.012,
        restitution: CUP_RESTITUTION,
      });

      Composite.add(engine.world, body);

      if (!imageCacheRef.current.has(sprite.src)) {
        const image = new Image();
        image.src = sprite.src;
        imageCacheRef.current.set(sprite.src, image);
      }

      spriteBodiesRef.current.push({ body, sprite, radius });
    };

    spriteSources.forEach(addDynamicSprite);

    const drawBody = (item: SpriteBody) => {
      const { body, radius, sprite } = item;
      const image = imageCacheRef.current.get(sprite.src);

      context.save();
      context.translate(body.position.x, body.position.y);
      context.rotate(body.angle);

      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      if (image?.complete && image.naturalWidth > 0) {
        context.drawImage(image, -radius, -radius, radius * 2, radius * 2);
      } else {
        context.fillStyle = "#f0d8be";
        context.fillRect(-radius, -radius, radius * 2, radius * 2);
        context.fillStyle = "#5c371d";
        context.font = `${Math.max(12, Math.round(radius * 0.9))}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("☕", 0, 1);
      }

      context.restore();

      context.save();
      context.translate(body.position.x, body.position.y);
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(50, 31, 12, 0.22)";
      context.lineWidth = 1;
      context.stroke();
      context.restore();
    };

    const renderLoop = () => {
      Engine.update(engine, 1000 / 60);
      context.clearRect(0, 0, width, height);
      for (const item of spriteBodiesRef.current) {
        drawBody(item);
      }
      animationFrameRef.current = window.requestAnimationFrame(renderLoop);
    };

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spriteSources, worldSize]);

  useEffect(() => {
    if (!isMotionActive || !engineRef.current) return;

    const onMotion = (event: DeviceMotionEvent) => {
      const gravity = engineRef.current?.gravity;
      if (!gravity) return;

      const ax = event.accelerationIncludingGravity?.x ?? 0;
      const ay = event.accelerationIncludingGravity?.y ?? 9.8;

      gravity.x = clamp(-(ax * GRAVITY_SENSITIVITY), -1.4, 1.4);
      gravity.y = clamp(ay * GRAVITY_SENSITIVITY, -1.4, 1.4);
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!engineRef.current) return;

      const beta = clamp(event.beta ?? 0, -45, 45);
      const gamma = clamp(event.gamma ?? 0, -45, 45);

      engineRef.current.gravity.x = clamp(gamma / 45, -1.4, 1.4);
      engineRef.current.gravity.y = clamp(beta / 45, -1.4, 1.4);
    };

    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [isMotionActive]);

  const enableMotion = async () => {
    if (typeof window === "undefined") return;

    const motionApi = window.DeviceMotionEvent as
      | (typeof DeviceMotionEvent & {
          requestPermission?: () => Promise<"granted" | "denied">;
        })
      | undefined;

    if (!window.DeviceMotionEvent && !window.DeviceOrientationEvent) {
      return;
    }

    if (typeof motionApi?.requestPermission === "function") {
      try {
        const result = await motionApi.requestPermission();
        if (result === "granted") {
          setIsMotionActive(true);
        } else {
          setIsMotionActive(false);
        }
      } catch {
        setIsMotionActive(false);
      }
      return;
    }

    setIsMotionActive(true);
  };

  return (
    <section className={`w-full ${className ?? ""}`}>
      <div
        ref={rootRef}
        className="relative h-[330px] overflow-hidden rounded-2xl border border-[var(--cafino-border)] bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklab,var(--cafino-soft)_40%,white),color-mix(in_oklab,var(--cafino-soft)_86%,#f5f5f5))]"
      >
        <button
          onClick={enableMotion}
          aria-label={isMotionActive ? "Motion active" : "Enable motion"}
          title={isMotionActive ? "Motion active" : "Enable motion"}
          className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--cafino-border)] bg-white/92 text-sm font-semibold text-[var(--cafino-text)] shadow-sm backdrop-blur"
        >
          {isMotionActive ? "✓" : "↗"}
        </button>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Coffee cup physics simulation" />
      </div>
    </section>
  );
}
