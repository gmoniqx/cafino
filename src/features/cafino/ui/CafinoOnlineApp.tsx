"use client";

import Image from "next/image";
import { BarChart3, ChevronLeft, ChevronRight, Coffee, Hand, Plus, Search, Settings, Share, SquarePen } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useCafinoStore } from "@/features/cafino/store/useCafinoStore";
import { CAFINO_THEMES, getThemeChoice } from "@/features/cafino/theme/themes";

const COFFEE_TYPES = [
  { id: "espresso", label: "Espresso", emoji: "☕", caffeine: 63 },
  { id: "americano", label: "Americano", emoji: "🥃", caffeine: 75 },
  { id: "latte", label: "Latte", emoji: "🥛", caffeine: 75 },
  { id: "cappuccino", label: "Cappuccino", emoji: "☁️", caffeine: 75 },
  { id: "flatwhite", label: "Flat White", emoji: "⬜", caffeine: 130 },
  { id: "mocha", label: "Mocha", emoji: "🍫", caffeine: 90 },
  { id: "signature", label: "Signature", emoji: "✨", caffeine: 100 },
  { id: "others", label: "Others", emoji: "➕", caffeine: 80 },
] as const;

type CoffeeTypeId = (typeof COFFEE_TYPES)[number]["id"];

const SIZE_CAFFEINE: Record<string, number> = { Small: 0.75, Medium: 1, Large: 1.3, XL: 1.6 };
const MONTH_SHORT = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ACTION_WIDTH = 170;

type StatsPeriod = "week" | "month" | "year";
type TempOption = "Iced" | "Hot";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateCard(key: string) {
  const [yy, mm, dd] = key.split("-").map(Number);
  const d = new Date(yy, mm - 1, dd);
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${dayName}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

interface DraftState {
  editingId: string | null;
  selectedDate: string;
  type: CoffeeTypeId;
  size: string;
  temp: TempOption;
  name: string;
  caffeine: number;
  sugar: number;
  price: number;
  photo: string | null;
  homemade: boolean;
  note: string;
  homeDisplay: boolean;
}

function defaultDraft(date: string, initialType: CoffeeTypeId = COFFEE_TYPES[0].id): DraftState {
  const selected = COFFEE_TYPES.find((item) => item.id === initialType) ?? COFFEE_TYPES[0];
  return {
    editingId: null,
    selectedDate: date,
    type: selected.id,
    size: "Medium",
    temp: "Iced",
    name: "",
    caffeine: selected.caffeine,
    sugar: 0,
    price: 0,
    photo: null,
    homemade: false,
    note: "",
    homeDisplay: false,
  };
}

export function CafinoOnlineApp() {
  const started = useCafinoStore((s) => s.started);
  const setStarted = useCafinoStore((s) => s.setStarted);
  const activeTab = useCafinoStore((s) => s.activeTab);
  const setActiveTab = useCafinoStore((s) => s.setActiveTab);
  const logs = useCafinoStore((s) => s.logs);
  const upsertLog = useCafinoStore((s) => s.upsertLog);
  const removeLog = useCafinoStore((s) => s.removeLog);
  const cafLimit = useCafinoStore((s) => s.cafLimit);
  const setCafLimit = useCafinoStore((s) => s.setCafLimit);
  const shareCards = useCafinoStore((s) => s.shareCards);
  const setShareCards = useCafinoStore((s) => s.setShareCards);
  const brandManage = useCafinoStore((s) => s.brandManage);
  const setBrandManage = useCafinoStore((s) => s.setBrandManage);
  const themeId = useCafinoStore((s) => s.themeId);
  const setThemeId = useCafinoStore((s) => s.setThemeId);
  const preferredType = useCafinoStore((s) => s.preferredType);
  const setPreferredType = useCafinoStore((s) => s.setPreferredType);
  const wallpaper = useCafinoStore((s) => s.wallpaper);
  const setWallpaper = useCafinoStore((s) => s.setWallpaper);

  const [showAdd, setShowAdd] = useState(false);
  const [showDateDetail, setShowDateDetail] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showWidgetsSheet, setShowWidgetsSheet] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth());
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("week");
  const [cupMotion, setCupMotion] = useState({ x: 0, y: 0 });
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [installingApp, setInstallingApp] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [dismissedIosInstallHint, setDismissedIosInstallHint] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const dragRef = useRef<{ id: string | null; startX: number; base: number }>({ id: null, startX: 0, base: 0 });
  const safePreferredType = (COFFEE_TYPES.find((item) => item.id === preferredType)?.id ?? COFFEE_TYPES[0].id) as CoffeeTypeId;
  const [draft, setDraft] = useState<DraftState>(defaultDraft(todayKey(), safePreferredType));

  const dayKey = todayKey();
  const todayLogs = useMemo(() => logs.filter((l) => l.date === dayKey).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [logs, dayKey]);
  const todayCaf = todayLogs.reduce((sum, item) => sum + item.caffeine, 0);

  const logsForSelectedDay = useMemo(
    () => logs.filter((entry) => entry.date === selectedDate).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [logs, selectedDate],
  );
  const selectedDayCaffeine = logsForSelectedDay.reduce((sum, entry) => sum + entry.caffeine, 0);
  const selectedDaySugar = logsForSelectedDay.reduce((sum, entry) => sum + entry.sugar, 0);
  const selectedDateLabel = formatDateCard(selectedDate);
  const selectedDateDayName = selectedDateLabel.split(",")[0] ?? "";
  const selectedDateShort = selectedDateLabel.split(",")[1]?.trim() ?? selectedDateLabel;
  const activeThemeChoice = getThemeChoice(themeId);
  const themeVars = {
    "--cafino-accent": activeThemeChoice.accent,
    "--cafino-accent-strong": `color-mix(in oklab, ${activeThemeChoice.accent} 84%, black)`,
    "--cafino-text": `color-mix(in oklab, ${activeThemeChoice.accent} 34%, #1a1a1a)`,
    "--cafino-text-soft": `color-mix(in oklab, ${activeThemeChoice.accent} 22%, #2b2b2b)`,
    "--cafino-text-muted": `color-mix(in oklab, ${activeThemeChoice.accent} 26%, #707070)`,
    "--cafino-text-subtle": `color-mix(in oklab, ${activeThemeChoice.accent} 18%, #9a9a9a)`,
    "--cafino-soft": activeThemeChoice.soft,
    "--cafino-soft-alt": `color-mix(in oklab, ${activeThemeChoice.soft} 80%, white)`,
    "--cafino-soft-strong": `color-mix(in oklab, ${activeThemeChoice.soft} 78%, ${activeThemeChoice.accent})`,
    "--cafino-surface": `color-mix(in oklab, white 93%, ${activeThemeChoice.soft})`,
    "--cafino-surface-2": `color-mix(in oklab, white 86%, ${activeThemeChoice.soft})`,
    "--cafino-border": `color-mix(in oklab, ${activeThemeChoice.accent} 18%, #d8d8d8)`,
    "--cafino-danger": "#ff3131",
    "--cafino-chart-grid": `color-mix(in oklab, ${activeThemeChoice.soft} 75%, #d8d8d8)`,
  } as CSSProperties;

  const statsLogs = useMemo(() => {
    const now = new Date();
    if (statsPeriod === "week") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      return logs.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= from && d <= now;
      });
    }

    if (statsPeriod === "month") {
      return logs.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === statsYear && d.getMonth() === statsMonth;
      });
    }

    return logs.filter((l) => new Date(l.createdAt).getFullYear() === statsYear);
  }, [logs, statsPeriod, statsMonth, statsYear]);

  const barData = useMemo(() => {
    if (statsPeriod === "week") {
      const labels = ["S", "M", "T", "W", "T", "F", "S"];
      return Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - idx));
        const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
        return { label: labels[d.getDay()], cups: logs.filter((l) => l.date === key).length };
      });
    }

    if (statsPeriod === "month") {
      const max = new Date(statsYear, statsMonth + 1, 0).getDate();
      return Array.from({ length: max }).map((_, idx) => {
        const day = idx + 1;
        const key = dateKey(statsYear, statsMonth, day);
        return { label: day % 5 === 0 ? String(day) : "", cups: logs.filter((l) => l.date === key).length };
      });
    }

    return MONTH_SHORT.map((m, idx) => ({
      label: m[0],
      cups: logs.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === statsYear && d.getMonth() === idx;
      }).length,
    }));
  }, [statsPeriod, logs, statsYear, statsMonth]);

  const hasBarData = barData.some((item) => item.cups > 0);
  const statsTopLog = statsLogs.length > 0 ? statsLogs[statsLogs.length - 1] : null;
  const showIosInstallHint = isIosSafari && !isStandaloneMode && !showInstallButton && !dismissedIosInstallHint;

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const media = window.matchMedia("(display-mode: standalone)");
    const ua = navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua);
    const safariBrowser = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    const updateMode = () => {
      setIsStandaloneMode(media.matches);
      setIsIosSafari(iosDevice && safariBrowser);
    };

    const timer = window.setTimeout(updateMode, 0);
    const onModeChange = () => setIsStandaloneMode(media.matches);
    media.addEventListener("change", onModeChange);

    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", onModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
      setShowInstallButton(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || activeTab !== "stats" || statsLogs.length === 0) {
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const x = Math.sin(elapsed * 1.25) * 7;
      const y = Math.cos(elapsed * 1.7) * 4;
      setCupMotion({ x, y });
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      setCupMotion({ x: 0, y: 0 });
    };
  }, [activeTab, statsLogs.length]);

  const onStatsMonthShift = (direction: -1 | 1) => {
    const nextMonth = statsMonth + direction;
    if (nextMonth > 11) {
      setStatsMonth(0);
      setStatsYear((value) => value + 1);
      return;
    }
    if (nextMonth < 0) {
      setStatsMonth(11);
      setStatsYear((value) => value - 1);
      return;
    }
    setStatsMonth(nextMonth);
  };

  const openAdd = (targetDate: string) => {
    setSelectedDate(targetDate);
    const existing = logs
      .filter((entry) => entry.date === targetDate)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

    if (existing) {
      setDraft({
        editingId: existing.id,
        selectedDate: targetDate,
        type: existing.type as CoffeeTypeId,
        size: existing.size,
        temp: existing.temp,
        name: existing.name,
        caffeine: existing.caffeine,
        sugar: existing.sugar,
        price: existing.price,
        photo: existing.photo,
        homemade: existing.homemade,
        note: existing.note,
        homeDisplay: existing.homeDisplay,
      });
      setShowAdd(true);
      return;
    }

    const fresh = defaultDraft(targetDate, safePreferredType);
    setDraft(fresh);
    setShowAdd(true);
  };

  const onSave = () => {
    upsertLog({
      id: draft.editingId ?? `${Date.now()}-${Math.round(Math.random() * 100000)}`,
      type: draft.type,
      name: draft.name,
      size: draft.size,
      temp: draft.temp,
      homemade: draft.homemade,
      caffeine: draft.caffeine,
      sugar: draft.sugar,
      price: draft.price,
      note: draft.note,
      homeDisplay: draft.homeDisplay,
      photo: draft.photo,
      date: draft.selectedDate,
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
  };

  const onTypeChange = (nextType: CoffeeTypeId) => {
    const info = COFFEE_TYPES.find((t) => t.id === nextType) ?? COFFEE_TYPES[0];
    setDraft((prev) => ({
      ...prev,
      type: nextType,
      caffeine: Math.round(info.caffeine * (SIZE_CAFFEINE[prev.size] ?? 1)),
    }));
  };

  const onSizeChange = (nextSize: string) => {
    const info = COFFEE_TYPES.find((t) => t.id === draft.type) ?? COFFEE_TYPES[0];
    setDraft((prev) => ({
      ...prev,
      size: nextSize,
      caffeine: Math.round(info.caffeine * (SIZE_CAFFEINE[nextSize] ?? 1)),
    }));
  };

  const onSwipeStart = (id: string, clientX: number) => {
    dragRef.current = {
      id,
      startX: clientX,
      base: swipeOffsets[id] ?? 0,
    };
  };

  const onSwipeMove = (clientX: number) => {
    const drag = dragRef.current;
    if (!drag.id) {
      return;
    }

    const nextOffset = Math.max(-ACTION_WIDTH, Math.min(0, drag.base + clientX - drag.startX));
    setSwipeOffsets({ [drag.id]: nextOffset });
  };

  const onSwipeEnd = () => {
    const drag = dragRef.current;
    if (!drag.id) {
      return;
    }

    const value = swipeOffsets[drag.id] ?? 0;
    setSwipeOffsets(value <= -ACTION_WIDTH / 3 ? { [drag.id]: -ACTION_WIDTH } : {});
    dragRef.current = { id: null, startX: 0, base: 0 };
  };

  const onShare = async (id: string) => {
    const target = logs.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const typeInfo = COFFEE_TYPES.find((item) => item.id === target.type) ?? COFFEE_TYPES[0];
    const text = `${target.name || typeInfo.label} · ${target.size} · ${target.temp} · ${target.caffeine} mg`;

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Cafino Coffee", text });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const onShareStats = async () => {
    const totalCaffeine = statsLogs.reduce((sum, item) => sum + item.caffeine, 0);
    const totalSugar = statsLogs.reduce((sum, item) => sum + item.sugar, 0);
    const totalSpend = statsLogs.reduce((sum, item) => sum + item.price, 0);
    const reportLabel = statsPeriod[0].toUpperCase() + statsPeriod.slice(1);
    const text = [
      `Cafino ${reportLabel} Report`,
      `${MONTH_SHORT[statsMonth]} ${statsYear}`,
      `Cups: ${statsLogs.length}`,
      `Caffeine: ${totalCaffeine} mg`,
      `Sugar: ${totalSugar} g`,
      `Spend: ${totalSpend.toFixed(0)}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Cafino Coffee Report", text });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const onWallpaperChange = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setWallpaper(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const onInstallApp = async () => {
    if (!installPromptEvent) {
      return;
    }

    setInstallingApp(true);
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    setInstallPromptEvent(null);
    setShowInstallButton(false);
    setInstallingApp(false);

    if (choice.outcome === "dismissed") {
      return;
    }
  };

  if (!started) {
    return (
      <main className="cafino-app cafino-frame flex w-full flex-col bg-[var(--cafino-soft)] p-3.5 sm:p-5" style={themeVars}>
        <div className="mb-6 mt-6 flex flex-col items-center">
          <div className="mb-6 h-28 w-28 overflow-hidden rounded-[30px] bg-white shadow-md sm:h-36 sm:w-36">
            <Image src="/download.png" alt="Cafino logo" width={144} height={144} className="h-full w-full object-cover" priority />
          </div>
          <h1 className="cafino-title-xl text-[var(--cafino-text)]">Cafino</h1>
          <p className="cafino-text-md mt-2 text-[var(--cafino-text-muted)]">Record your coffee journey</p>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 sm:gap-3">
          {["Minimalist Design", "Coffee Calendar", "Coffee Statistics", "Card Sharing"].map((title, idx) => (
            <div key={title} className="cafino-surface rounded-3xl border border-[var(--cafino-border)] bg-white p-3.5 sm:p-4">
              <p className="cafino-title-lg text-[var(--cafino-text)]">{title}</p>
              <p className="cafino-text-md mt-1 text-[var(--cafino-text-muted)]">{idx === 0 ? "Simple style to record every cup of coffee" : idx === 1 ? "Calendar statistics, clear and easy to browse" : idx === 2 ? "Multi-dimensional statistics by week, month, year" : "Beautiful coffee cards to share"}</p>
            </div>
          ))}
        </div>

        <button className="mt-4 h-14 rounded-3xl bg-[var(--cafino-accent)] text-xl font-bold text-white shadow-sm sm:h-16 sm:text-2xl" onClick={() => setStarted(true)}>
          Get Started
        </button>

        {showInstallButton && (
          <button
            className="mt-2 h-12 rounded-3xl border border-[var(--cafino-accent)] bg-white text-base font-semibold text-[var(--cafino-accent-strong)] sm:h-14 sm:text-lg"
            onClick={onInstallApp}
            disabled={installingApp}
          >
            {installingApp ? "Preparing Install..." : "Install App"}
          </button>
        )}

        {showIosInstallHint && (
          <div className="mt-2 rounded-3xl border border-[var(--cafino-border)] bg-white p-4 text-left">
            <p className="text-base font-semibold text-[var(--cafino-text)] sm:text-lg">Install on iPhone</p>
            <p className="mt-1 text-sm text-[var(--cafino-text-muted)] sm:text-base">Open Safari menu, tap Share, then tap Add to Home Screen.</p>
            <button
              className="mt-3 rounded-2xl border border-[var(--cafino-border)] px-3 py-1.5 text-sm font-medium text-[var(--cafino-text-soft)]"
              onClick={() => setDismissedIosInstallHint(true)}
            >
              Dismiss
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="cafino-app cafino-frame flex w-full flex-col bg-[var(--cafino-soft)]" style={themeVars}>
      <div className="flex-1 overflow-y-auto px-3.5 pb-3 pt-3 sm:px-4 sm:pt-4">
        {activeTab === "home" && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="cafino-title-lg text-[var(--cafino-text)]">{MONTH_SHORT[calMonth]}</h2>
              <div className="flex items-center gap-1.5 min-[360px]:gap-2">
                <button
                  className="h-8 w-8 rounded-full border border-[var(--cafino-border)] bg-white"
                  onClick={() => {
                    const m = calMonth - 1;
                    if (m < 0) {
                      setCalMonth(11);
                      setCalYear((y) => y - 1);
                    } else {
                      setCalMonth(m);
                    }
                  }}
                >
                  ‹
                </button>
                <span className="text-sm text-[var(--cafino-text-muted)]">{MONTH_SHORT[calMonth]} {calYear}</span>
                <button
                  className="h-8 w-8 rounded-full border border-[var(--cafino-border)] bg-white"
                  onClick={() => {
                    const m = calMonth + 1;
                    if (m > 11) {
                      setCalMonth(0);
                      setCalYear((y) => y + 1);
                    } else {
                      setCalMonth(m);
                    }
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            <div className="cafino-surface mb-3.5 rounded-2xl bg-white p-3.5 sm:p-4">
              <div className="mb-2 grid grid-cols-7 text-center text-xs text-[var(--cafino-text-muted)]">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, idx) => <div key={`e-${idx}`} />)}
                {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, idx) => {
                  const day = idx + 1;
                  const key = dateKey(calYear, calMonth, day);
                  const dayLogs = logs.filter((l) => l.date === key);
                  const last = dayLogs[dayLogs.length - 1];
                  const info = COFFEE_TYPES.find((t) => t.id === last?.type) ?? COFFEE_TYPES[0];
                  const today = new Date();
                  const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  return (
                    <button
                      key={key}
                      className={`flex aspect-square items-center justify-center rounded-xl text-sm ${dayLogs.length > 0 ? "bg-[var(--cafino-surface-2)]" : isToday ? "bg-[var(--cafino-soft-strong)] font-semibold" : "bg-[var(--cafino-surface-2)]"} ${selectedDate === key ? "ring-2 ring-[var(--cafino-accent)]" : ""}`}
                      onClick={() => {
                        setSelectedDate(key);
                        if (dayLogs.length > 0) {
                          setShowDateDetail(true);
                        } else {
                          setShowDateDetail(false);
                          openAdd(key);
                        }
                      }}
                    >
                      {dayLogs.length > 0 ? (
                        last?.photo ? (
                          <Image src={last.photo} className="h-full w-full rounded-xl object-cover" alt="Coffee" width={56} height={56} unoptimized />
                        ) : info.emoji
                      ) : day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="mb-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cafino-accent)] text-base font-semibold text-white sm:h-12 sm:text-lg" onClick={() => openAdd(selectedDate)}>
              <Plus size={24} /> {logsForSelectedDay.length > 0 ? "Edit Cup" : "Add Cup"}
            </button>

            <h3 className="mb-2 text-lg font-bold min-[360px]:text-xl sm:text-2xl">Today's drink</h3>
            <div className="cafino-surface mb-3 rounded-2xl bg-white p-3.5 sm:p-4">
              <p className="text-sm text-[var(--cafino-text-muted)]">Caffeine</p>
              <div className="my-2 h-1.5 rounded-full bg-[var(--cafino-soft-alt)]">
                <div className="h-1.5 rounded-full bg-[var(--cafino-accent-strong)]" style={{ width: `${Math.min(100, (todayCaf / cafLimit) * 100)}%` }} />
              </div>
              <p className="text-sm text-[var(--cafino-text-muted)]">{todayCaf} mg / {cafLimit} mg</p>
            </div>

            {todayLogs.length === 0 ? (
              <div className="cafino-surface rounded-2xl bg-white p-4 text-sm text-[var(--cafino-text-muted)]">Nothing logged today ☕</div>
            ) : null}

            {todayLogs.map((entry) => {
              const typeInfo = COFFEE_TYPES.find((t) => t.id === entry.type) ?? COFFEE_TYPES[0];
              const offset = swipeOffsets[entry.id] ?? 0;
              return (
                <div key={entry.id} className="relative mb-2 overflow-hidden rounded-2xl">
                  <div className="absolute inset-y-0 right-0 flex">
                    <button className="w-[85px] bg-[var(--cafino-accent)] text-lg font-medium text-white" onClick={() => onShare(entry.id)}>Share</button>
                    <button className="w-[85px] bg-[var(--cafino-danger)] text-lg font-medium text-white" onClick={() => removeLog(entry.id)}>Delete</button>
                  </div>

                  <div
                    className="cafino-surface relative flex touch-pan-y items-center gap-3 rounded-2xl bg-white p-3 transition-transform duration-200"
                    style={{ transform: `translateX(${offset}px)` }}
                    onPointerDown={(event) => onSwipeStart(entry.id, event.clientX)}
                    onPointerMove={(event) => {
                      if (event.buttons === 1) {
                        onSwipeMove(event.clientX);
                      }
                    }}
                    onPointerUp={onSwipeEnd}
                    onPointerCancel={onSwipeEnd}
                    onPointerLeave={onSwipeEnd}
                  >
                    {entry.photo ? (
                      <Image src={entry.photo} className="h-14 w-14 rounded-xl object-cover" alt="Coffee" width={56} height={56} unoptimized />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--cafino-surface-2)] text-2xl">{typeInfo.emoji}</div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{entry.name || typeInfo.label}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">{entry.temp === "Hot" ? "🔥" : "🧊"} {entry.size} · {formatTime(entry.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[var(--cafino-accent-strong)] min-[360px]:text-2xl">{entry.caffeine}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">mg</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {todayLogs.length > 0 && (
              <div className="mx-auto mt-2 inline-flex rounded-full bg-[var(--cafino-soft-strong)] px-5 py-2 text-sm font-semibold text-[var(--cafino-text)]">
                Swipe left to share/delete record
              </div>
            )}
          </section>
        )}

        {activeTab === "stats" && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="cafino-title-xl">Statistics</h2>
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cafino-soft-alt)]" onClick={() => onStatsMonthShift(-1)}>
                  <ChevronLeft size={18} className="text-[var(--cafino-text-muted)]" />
                </button>
                <span className="rounded-full bg-[var(--cafino-soft-alt)] px-2.5 py-2 text-xs text-[var(--cafino-text-soft)] min-[360px]:px-3 min-[360px]:text-sm sm:px-4 sm:text-base">{MONTH_SHORT[statsMonth]} {statsYear}</span>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cafino-soft-alt)]" onClick={() => onStatsMonthShift(1)}>
                  <ChevronRight size={18} className="text-[var(--cafino-text-muted)]" />
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
              {(["week", "month", "year"] as StatsPeriod[]).map((p) => (
                <button key={p} className={`rounded-full px-3 py-1.5 text-xs min-[360px]:px-4 min-[360px]:py-2 min-[360px]:text-sm sm:px-5 sm:text-base ${statsPeriod === p ? "bg-[var(--cafino-accent)] text-white" : "bg-white text-[var(--cafino-text)]"}`} onClick={() => setStatsPeriod(p)}>
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
              <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cafino-soft-alt)]" onClick={onShareStats}>
                <Share size={18} className="text-[var(--cafino-accent)]" />
              </button>
            </div>

            {statsLogs.length > 0 && (
              <>
                <div className="relative mb-3 inline-flex max-w-full rounded-3xl bg-[var(--cafino-soft-strong)] px-4 py-3 text-sm font-semibold text-[var(--cafino-text)] sm:px-5 sm:text-base">
                  Tap on the right to share weekly, monthly, yearly coffee reports
                </div>

                <button
                  className="relative mb-4 flex h-52 w-full items-end justify-end overflow-hidden rounded-3xl bg-white p-4"
                >
                  <div
                    className="pointer-events-none select-none text-7xl"
                    style={{
                      transform: `translate3d(${cupMotion.x}px, ${cupMotion.y}px, 0)`,
                      transition: "transform 180ms ease-out",
                    }}
                  >
                    {statsTopLog?.photo ? (
                      <Image
                        src={statsTopLog.photo}
                        alt="Coffee hero"
                        width={96}
                        height={120}
                        className="h-32 w-24 object-cover drop-shadow-md"
                        unoptimized
                      />
                    ) : (
                      (COFFEE_TYPES.find((item) => item.id === statsTopLog?.type)?.emoji ?? "☕")
                    )}
                  </div>
                </button>
              </>
            )}

            <div className="cafino-surface mb-4 rounded-3xl bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Cups</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Spend</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.reduce((s, l) => s + l.price, 0).toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="cafino-surface mb-4 rounded-3xl bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Caffeine</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.reduce((s, l) => s + l.caffeine, 0)}<span className="ml-1 text-xl font-semibold text-[var(--cafino-text-muted)] min-[360px]:text-2xl sm:text-3xl">mg</span></p>
                </div>
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Daily Avg</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.length === 0 ? 0 : Math.round(statsLogs.reduce((s, l) => s + l.caffeine, 0) / Math.max(1, new Set(statsLogs.map((i) => i.date)).size))}<span className="ml-1 text-xl font-semibold text-[var(--cafino-text-muted)] min-[360px]:text-2xl sm:text-3xl">mg</span></p>
                </div>
              </div>
            </div>

            <div className="cafino-surface mb-4 rounded-3xl bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Sugar</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.reduce((s, l) => s + l.sugar, 0)}<span className="ml-1 text-xl font-semibold text-[var(--cafino-text-muted)] min-[360px]:text-2xl sm:text-3xl">g</span></p>
                </div>
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Daily Avg</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.length === 0 ? 0 : Math.round(statsLogs.reduce((s, l) => s + l.sugar, 0) / Math.max(1, new Set(statsLogs.map((i) => i.date)).size))}<span className="ml-1 text-xl font-semibold text-[var(--cafino-text-muted)] min-[360px]:text-2xl sm:text-3xl">g</span></p>
                </div>
              </div>
            </div>

            <div className="cafino-surface rounded-3xl bg-white p-4 sm:p-5">
              <p className="mb-4 text-base text-[var(--cafino-text)] sm:text-lg">Daily Cups</p>
              <div className="h-48 w-full">
                {hasBarData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cafino-chart-grid)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "color-mix(in oklab, var(--cafino-accent) 35%, #999)", fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="cups" fill="var(--cafino-accent)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-end gap-2">
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <div key={`empty-bar-${idx}`} className="h-2 flex-1 rounded-full bg-[var(--cafino-soft-alt)]" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section>
            <h2 className="cafino-title-xl mb-3 text-[var(--cafino-text)]">Settings</h2>

            <div className="mb-3 grid grid-cols-1 gap-3">
              <button
                className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5"
                onClick={() => setShowTypeSheet(true)}
              >
                <p className="text-2xl font-semibold leading-none text-[var(--cafino-text)] sm:text-3xl">Drink</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">Tap to edit drink type</p>
              </button>

              <button
                className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5"
                onClick={() => setShowWidgetsSheet(true)}
              >
                <p className="text-2xl font-semibold leading-none text-[var(--cafino-text)] sm:text-3xl">Widgets</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">See how to add Cafino widget to your home screen</p>
              </button>
            </div>

            <div className="cafino-surface mb-3 rounded-[30px] border border-[var(--cafino-border)] bg-white p-4 sm:p-5">
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Daily Caffeine Limit</p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="range"
                  min={100}
                  max={800}
                  step={100}
                  value={cafLimit}
                  onChange={(e) => setCafLimit(Number(e.target.value))}
                  className="h-2 w-full accent-[var(--cafino-accent)]"
                />
                <p className="text-3xl font-bold leading-none text-[var(--cafino-accent)] sm:text-4xl">{cafLimit}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">FDA recommends 400mg per day for healthy adults</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 sm:p-5">
                <p className="text-2xl font-semibold leading-none sm:text-3xl">Share Cards</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[var(--cafino-text-muted)] sm:text-base">WM</p>
                  <button
                    className={`h-10 w-16 rounded-full ${shareCards ? "bg-[var(--cafino-accent)]" : "bg-[var(--cafino-soft-alt)]"}`}
                    onClick={() => setShareCards(!shareCards)}
                  >
                    <span className={`block h-8 w-8 rounded-full bg-white transition-transform ${shareCards ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              <button
                className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5"
                onClick={() => setShowThemeSheet(true)}
              >
                <p className="text-2xl font-semibold leading-none sm:text-3xl">Color Theme</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[var(--cafino-text-muted)] sm:text-base">{activeThemeChoice.emoji} {activeThemeChoice.label}</p>
                  <span className="h-10 w-10 rounded-full" style={{ backgroundColor: activeThemeChoice.accent }} />
                </div>
              </button>

              <div className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 sm:p-5">
                <p className="truncate text-2xl font-semibold leading-none sm:text-3xl">Brand Management</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[var(--cafino-text-muted)] sm:text-base">Enable</p>
                  <button
                    className={`h-10 w-16 rounded-full ${brandManage ? "bg-[var(--cafino-accent)]" : "bg-[var(--cafino-soft-alt)]"}`}
                    onClick={() => setBrandManage(!brandManage)}
                  >
                    <span className={`block h-8 w-8 rounded-full bg-white transition-transform ${brandManage ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              <label className="cafino-surface cursor-pointer rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5">
                <p className="text-2xl font-semibold leading-none sm:text-3xl">Wallpaper</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">Tap to upload a wallpaper</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onWallpaperChange(event.target.files?.[0])}
                />
                {wallpaper ? (
                  <Image src={wallpaper} alt="Wallpaper" width={220} height={90} className="mt-3 h-20 w-full rounded-2xl object-cover" unoptimized />
                ) : (
                  <p className="mt-4 text-sm text-[var(--cafino-text-muted)] sm:text-base">No wallpaper selected</p>
                )}
              </label>
            </div>
          </section>
        )}
      </div>

      <nav className="grid grid-cols-3 border-t border-[var(--cafino-border)] bg-[var(--cafino-soft)] py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <button className={`flex flex-col items-center py-2 text-sm ${activeTab === "home" ? "font-bold text-[var(--cafino-accent-strong)]" : "text-[var(--cafino-text-muted)]"}`} onClick={() => setActiveTab("home")}>
          <Coffee size={28} />
        </button>
        <button className={`flex flex-col items-center py-2 text-sm ${activeTab === "stats" ? "font-bold text-[var(--cafino-accent-strong)]" : "text-[var(--cafino-text-muted)]"}`} onClick={() => setActiveTab("stats")}>
          <BarChart3 size={28} />
        </button>
        <button className={`flex flex-col items-center py-2 text-sm ${activeTab === "settings" ? "font-bold text-[var(--cafino-accent-strong)]" : "text-[var(--cafino-text-muted)]"}`} onClick={() => setActiveTab("settings")}>
          <Settings size={28} />
        </button>
      </nav>

      {showWidgetsSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-[#efeeec] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#efeeec] px-4 py-3 sm:px-5">
              <button className="text-2xl text-[var(--cafino-text-muted)]" onClick={() => setShowWidgetsSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)]">Add Widgets</p>
              <span className="w-16" />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <p className="text-2xl leading-tight text-[var(--cafino-text)] sm:text-3xl">Follow these steps to add 'Cafino' to your home screen</p>

              <article className="rounded-3xl bg-white/85 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)] sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f4ef] text-[#9a855f]">
                    <Hand size={22} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Long press home screen</h3>
                    <p className="mt-2 text-[1.25rem] leading-snug text-[var(--cafino-text-muted)] sm:text-[1.35rem]">Long press on an empty area of home screen until app icons start shaking</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl bg-white/85 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)] sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f4ef] text-[#9a855f]">
                    <SquarePen size={22} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Tap 'Edit' {"->"} 'Add Widget'</h3>
                    <p className="mt-2 text-[1.25rem] leading-snug text-[var(--cafino-text-muted)] sm:text-[1.35rem]">Tap 'Edit' on top left, then select 'Add Widget'</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl bg-white/85 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)] sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f4ef] text-[#9a855f]">
                    <Search size={22} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Search for 'Cafino'</h3>
                    <p className="mt-2 text-[1.25rem] leading-snug text-[var(--cafino-text-muted)] sm:text-[1.35rem]">Type 'Cafino' in search box, find and add the widget</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {showTypeSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl duration-300 sm:max-w-[720px]" style={{ backgroundColor: activeThemeChoice.soft }}>
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] px-4 py-3" style={{ backgroundColor: activeThemeChoice.soft }}>
              <button className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl" onClick={() => setShowTypeSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Drink Type</p>
              <span className="w-12" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 min-[420px]:grid-cols-3">
              {COFFEE_TYPES.map((item) => {
                const selected = preferredType === item.id;
                return (
                  <button
                    key={item.id}
                    className={`rounded-3xl border p-4 text-center ${selected ? "border-[var(--cafino-accent)] bg-[var(--cafino-surface-2)]" : "border-[var(--cafino-border)] bg-white"}`}
                    onClick={() => {
                      setPreferredType(item.id);
                      setShowTypeSheet(false);
                    }}
                  >
                    <div className="text-4xl sm:text-5xl">{item.emoji}</div>
                    <p className="mt-2 text-sm font-medium text-[var(--cafino-text)] sm:mt-3 sm:text-base">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showThemeSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl duration-300 sm:max-w-[720px]" style={{ backgroundColor: activeThemeChoice.soft }}>
            <div className="sticky top-0 z-20 flex items-center justify-center border-b border-[var(--cafino-border)] px-4 py-4" style={{ backgroundColor: activeThemeChoice.soft }}>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Color Theme</p>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 min-[360px]:grid-cols-2">
              {CAFINO_THEMES.map((item) => {
                const selected = themeId === item.id;
                return (
                  <button
                    key={item.id}
                    className={`rounded-3xl border p-3 text-left ${selected ? "border-[3px]" : "border"}`}
                    style={{
                      borderColor: selected ? item.accent : "var(--cafino-border)",
                      backgroundColor: item.soft,
                    }}
                    onClick={() => setThemeId(item.id)}
                  >
                    <div className="rounded-2xl bg-white/70 p-3">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.accent }} />
                        <span className="h-2 w-12 rounded-full bg-[var(--cafino-soft-strong)]" />
                        <span className="ml-auto h-2 w-8 rounded-full bg-[var(--cafino-soft-strong)]" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.accent, opacity: 0.55 }} />
                        <span className="h-2 w-10 rounded-full bg-[var(--cafino-soft-strong)]" />
                        <span className="ml-auto h-2 w-6 rounded-full bg-[var(--cafino-soft-strong)]" />
                      </div>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[var(--cafino-text)] sm:text-xl">{item.emoji} {item.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 pt-0">
              <button
                className="h-12 w-full rounded-2xl bg-[var(--cafino-accent)] text-base font-semibold text-white sm:h-14 sm:text-lg"
                onClick={() => setShowThemeSheet(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateDetail && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <button className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl" onClick={() => setShowDateDetail(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Coffee Records</p>
              <button
                className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl"
                onClick={() => {
                  setShowDateDetail(false);
                  openAdd(selectedDate);
                }}
              >
                Save
              </button>
            </div>

            <div className="space-y-4 p-4">

            <div className="cafino-surface mb-4 rounded-2xl bg-white p-4 sm:p-5">
              <h3 className="text-3xl font-bold text-[var(--cafino-text)] sm:text-4xl">{selectedDateShort}</h3>
              <p className="mt-1 text-sm text-[var(--cafino-text-muted)] sm:text-base">{selectedDateDayName}</p>
            </div>

            <div className="cafino-surface mb-4 rounded-2xl bg-white p-4">
              <div className="grid grid-cols-3 divide-x divide-[var(--cafino-border)] text-center">
                <div>
                  <p className="text-3xl font-bold text-[var(--cafino-accent)] sm:text-4xl">{logsForSelectedDay.length}</p>
                  <p className="mt-1 text-xs text-[var(--cafino-text-muted)] sm:text-sm">Cups</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--cafino-accent)] sm:text-4xl">{selectedDayCaffeine}</p>
                  <p className="mt-1 text-xs text-[var(--cafino-text-muted)] sm:text-sm">Caffeine/mg</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--cafino-accent)] sm:text-4xl">{selectedDaySugar}</p>
                  <p className="mt-1 text-xs text-[var(--cafino-text-muted)] sm:text-sm">Sugar/g</p>
                </div>
              </div>
            </div>

            <button
              className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cafino-accent)] text-base font-semibold text-white sm:h-14 sm:text-lg"
              onClick={() => {
                setShowDateDetail(false);
                openAdd(selectedDate);
              }}
            >
              <Plus size={24} /> 
            </button>

            {logsForSelectedDay.length === 0 ? (
              <div className="cafino-surface rounded-2xl bg-white p-4 text-sm text-[var(--cafino-text-muted)]">No records on this date.</div>
            ) : (
              logsForSelectedDay.map((entry) => {
                const typeInfo = COFFEE_TYPES.find((t) => t.id === entry.type) ?? COFFEE_TYPES[0];
                return (
                  <div key={`detail-${entry.id}`} className="cafino-surface mb-2 flex items-center gap-3 rounded-2xl bg-white p-3">
                    {entry.photo ? (
                      <Image src={entry.photo} className="h-14 w-14 rounded-xl object-cover" alt="Coffee" width={56} height={56} unoptimized />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--cafino-surface-2)] text-2xl">{typeInfo.emoji}</div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{entry.name || typeInfo.label}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">{entry.temp === "Hot" ? "🔥" : "🧊"} {entry.size} · {formatTime(entry.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[var(--cafino-accent-strong)] min-[360px]:text-2xl">{entry.caffeine}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">mg</p>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <button onClick={() => setShowAdd(false)} className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl">Cancel</button>
              <p className="text-2xl font-semibold sm:text-3xl">Add Cup</p>
              <button onClick={onSave} className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl">Save</button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Photo (Optional)</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--cafino-border)] bg-white/50 p-8 text-center">
                  <span className="text-2xl text-[var(--cafino-accent-strong)]">📷</span>
                  <span className="mt-1 text-xl font-medium text-[var(--cafino-accent-strong)]">Add Photo</span>
                  <span className="text-sm text-[var(--cafino-text-subtle)]">Capture your coffee moment</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = typeof reader.result === "string" ? reader.result : null;
                        setDraft((prev) => ({ ...prev, photo: result }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {draft.photo && (
                  <div className="mt-2">
                    <Image src={draft.photo} alt="Preview" width={400} height={180} className="h-40 w-full rounded-2xl object-cover" unoptimized />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[var(--cafino-border)] bg-white p-4">
                <div>
                  <p className="text-xl font-semibold">{formatDateCard(draft.selectedDate)}</p>
                  <p className="text-sm text-[var(--cafino-text-muted)]">{formatTime(new Date().toISOString())}</p>
                </div>
                <span className="text-[var(--cafino-text-subtle)]">›</span>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Name (Optional)</label>
                <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="" className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3" />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[var(--cafino-border)] bg-white p-4">
                <div>
                  <p className="text-2xl font-semibold">Homemade</p>
                  <p className="text-sm text-[var(--cafino-text-muted)]">Record beans & brewing details</p>
                </div>
                <button className={`h-8 w-14 rounded-full ${draft.homemade ? "bg-[var(--cafino-accent-strong)]" : "bg-[var(--cafino-soft-alt)]"}`} onClick={() => setDraft((prev) => ({ ...prev, homemade: !prev.homemade }))}>
                  <span className={`block h-7 w-7 rounded-full bg-white transition-transform ${draft.homemade ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Drink Type</label>
                <div className="overflow-x-auto pb-1">
                  <div className="flex gap-2">
                  {COFFEE_TYPES.map((item) => (
                    <button key={item.id} className={`min-w-[86px] rounded-xl border px-2 py-2 text-xs ${draft.type === item.id ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-surface-2)]" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => onTypeChange(item.id as CoffeeTypeId)}>
                      <div className="text-lg">{item.emoji}</div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
                {["Small", "Medium", "Large", "XL"].map((s) => (
                  <button key={s} className={`rounded-xl border px-2 py-2 text-sm ${draft.size === s ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => onSizeChange(s)}>{s}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className={`rounded-xl border px-2 py-2 ${draft.temp === "Iced" ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => setDraft((prev) => ({ ...prev, temp: "Iced" as TempOption }))}>🧊 Iced</button>
                <button className={`rounded-xl border px-2 py-2 ${draft.temp === "Hot" ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => setDraft((prev) => ({ ...prev, temp: "Hot" as TempOption }))}>🔥 Hot</button>
              </div>

              <label className="block text-xl text-[var(--cafino-text-muted)]">Caffeine: <span className="font-semibold text-[var(--cafino-accent-strong)]">{draft.caffeine} mg</span></label>
              <input type="range" min={0} max={500} value={draft.caffeine} onChange={(e) => setDraft((prev) => ({ ...prev, caffeine: Number(e.target.value) }))} className="w-full" />

              <label className="block text-xl text-[var(--cafino-text-muted)]">Sugar: <span className="font-semibold text-[var(--cafino-accent-strong)]">{draft.sugar} g</span></label>
              <input type="range" min={0} max={100} value={draft.sugar} onChange={(e) => setDraft((prev) => ({ ...prev, sugar: Number(e.target.value) }))} className="w-full" />

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Price (Optional)</label>
                <input type="number" value={draft.price || ""} onChange={(e) => setDraft((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))} placeholder="" className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3" />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--cafino-text-muted)]">Note (Optional)</label>
                <div className="flex items-center gap-2 text-sm text-[var(--cafino-text-muted)]">
                  Home Display
                  <button className={`h-8 w-14 rounded-full ${draft.homeDisplay ? "bg-[var(--cafino-accent-strong)]" : "bg-[var(--cafino-soft-alt)]"}`} onClick={() => setDraft((prev) => ({ ...prev, homeDisplay: !prev.homeDisplay }))}>
                    <span className={`block h-7 w-7 rounded-full bg-white transition-transform ${draft.homeDisplay ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
              <textarea value={draft.note} onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))} placeholder="Morning ritual, with friends..." className="min-h-24 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
