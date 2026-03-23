"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BarChart3, Camera, ChevronLeft, ChevronRight, Coffee, Heart, MessageCircle, Plus, SendHorizontal, Settings, Share, UserRound } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { type TabName, useCafinoStore } from "@/features/cafino/store/useCafinoStore";
import { CAFINO_THEMES, getThemeChoice } from "@/features/cafino/theme/themes";

interface CoffeeTypeOption {
  id: string;
  label: string;
  emoji: string;
  icon?: string;
  caffeine: number;
  sugar?: number;
  isCustom?: boolean;
}

interface CustomCoffeeType {
  id: string;
  label: string;
  emoji: string;
  order: number;
  caffeine: number;
  sugar: number;
}

const COFFEE_TYPES: CoffeeTypeOption[] = [
  { id: "espresso", label: "Espresso", emoji: "☕", icon: "/espresso.png", caffeine: 63 },
  { id: "americano", label: "Americano", emoji: "🥃", icon: "/americano.png", caffeine: 75 },
  { id: "latte", label: "Latte", emoji: "🥛", icon: "/latte.png", caffeine: 75 },
  { id: "cappuccino", label: "Cappuccino", emoji: "☁️", icon: "/cappuccino.png", caffeine: 75 },
  { id: "mocha", label: "Mocha", emoji: "🍫", icon: "/mocha.png", caffeine: 90 },
  { id: "matcha", label: "Matcha", emoji: "🍵", icon: "/matcha.png", caffeine: 70 },
  { id: "signature", label: "Signature", emoji: "✨", icon: "/signature.png", caffeine: 100 },
  { id: "others", label: "Others", emoji: "➕", icon: "/others.png", caffeine: 80 },
] as const;

const DEFAULT_TYPE_ICONS = [
  "☕", "🥤", "🧋", "🍵", "🫖",
  "🥛", "🍼", "🧃", "🥃", "🍷",
  "🥂", "🍾", "🍹", "🍸", "☁️",
  "⚪", "🔥", "🧊", "🍫", "🍪",
  "🥐", "🧈", "🍰", "🎂", "☀️",
] as const;

type CoffeeTypeId = string;

const SIZE_CAFFEINE: Record<string, number> = { Small: 0.75, Medium: 1, Large: 1.3, XL: 1.6 };
const MONTH_SHORT = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ACTION_WIDTH = 170;
const DEV_NAME = "Gayle Monique Florencio";
const DEV_ROLE = "Developer";
const DEV_LOCATION = "Philippines";
const DEV_EMAIL = "gayle@zentariph.com";
const DEV_PORTFOLIO_URL = "https://portfolio-gayle.vercel.app";
const DONATION_URL = "https://buymeacoffee.com/cafino";

type StatsPeriod = "week" | "month" | "year";
type TempOption = "Iced" | "Hot";
type RoastLevel = "Light" | "Medium" | "Dark" | "";
type BrewTimeUnit = "s" | "m" | "h";

interface BeanTemplate {
  id: string;
  name: string;
  origin: string;
  roast: RoastLevel;
  flavor: string;
}

interface BrewTemplate {
  id: string;
  label: string;
  method: string;
  grind: string;
  dose: number;
  water: number;
  time: number;
  unit: BrewTimeUnit;
}

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

function formatPeso(value: number) {
  return `₱${value.toFixed(0)}`;
}

function startOfWeek(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - day);
  return normalized;
}

function formatWeekRange(start: Date, end: Date) {
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
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
  homemadeBrand: string;
  beanName: string;
  beanOrigin: string;
  beanRoast: RoastLevel;
  beanFlavor: string;
  brewMethod: string;
  brewGrind: string;
  brewDose: number;
  brewWater: number;
  brewTime: number;
  brewTimeUnit: BrewTimeUnit;
  brewNotes: string;
  note: string;
  homeDisplay: boolean;
}

interface BrandItem {
  id: string;
  name: string;
  order: number;
  logo: string | null;
  cutout: boolean;
}

interface ShareCardPayload {
  title: string;
  subtitle: string;
  highlights: Array<{ label: string; value: string }>;
  caption?: string;
}

interface ShareCardSticker {
  imageSrc?: string | null;
  emoji?: string;
  label: string;
}

const DEFAULT_BEAN_TEMPLATES: BeanTemplate[] = [
  {
    id: "bean-colombian-supremo",
    name: "Colombian Supremo",
    origin: "Colombia",
    roast: "Medium",
    flavor: "Balanced, caramel, nutty",
  },
  {
    id: "bean-ethiopian-yirgacheffe",
    name: "Ethiopian Yirgacheffe",
    origin: "Ethiopia",
    roast: "Light",
    flavor: "Citrus, floral, tea-like",
  },
  {
    id: "bean-yunnan-arabica",
    name: "Yunnan Arabica",
    origin: "Yunnan, China",
    roast: "Medium",
    flavor: "Nutty, chocolate, mild acidity",
  },
];

const DEFAULT_BREW_TEMPLATES: BrewTemplate[] = [
  { id: "brew-cold-brew", label: "Cold Brew", method: "Cold Brew", grind: "Coarse", dose: 100, water: 1000, time: 12, unit: "h" },
  { id: "brew-espresso", label: "Espresso", method: "Espresso", grind: "Fine", dose: 18, water: 36, time: 28, unit: "s" },
  { id: "brew-aeropress", label: "AeroPress", method: "AeroPress", grind: "Medium Fine", dose: 17, water: 250, time: 90, unit: "s" },
  { id: "brew-v60", label: "V60", method: "V60", grind: "Medium", dose: 15, water: 250, time: 2, unit: "m" },
];

function DrinkTypeIcon({
  type,
  size,
  className,
}: {
  type: CoffeeTypeOption;
  size: number;
  className?: string;
}) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (loadFailed || !type.icon) {
    return (
      <span className={className} aria-hidden>
        {type.emoji}
      </span>
    );
  }

  return (
    <Image
      src={type.icon}
      alt={type.label}
      width={size}
      height={size}
      className={className}
      unoptimized
      onError={() => setLoadFailed(true)}
    />
  );
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
    homemadeBrand: "Others",
    beanName: "",
    beanOrigin: "",
    beanRoast: "",
    beanFlavor: "",
    brewMethod: "",
    brewGrind: "",
    brewDose: 0,
    brewWater: 0,
    brewTime: 0,
    brewTimeUnit: "m",
    brewNotes: "",
    note: "",
    homeDisplay: false,
  };
}

export function CafinoOnlineApp() {
  const router = useRouter();
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
  const themeId = useCafinoStore((s) => s.themeId);
  const setThemeId = useCafinoStore((s) => s.setThemeId);
  const preferredType = useCafinoStore((s) => s.preferredType);
  const wallpaper = useCafinoStore((s) => s.wallpaper);
  const setWallpaper = useCafinoStore((s) => s.setWallpaper);

  const [showAdd, setShowAdd] = useState(false);
  const [showNewCoffeeTypeSheet, setShowNewCoffeeTypeSheet] = useState(false);
  const [showTypeIconSheet, setShowTypeIconSheet] = useState(false);
  const [showDateDetail, setShowDateDetail] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showBrandSheet, setShowBrandSheet] = useState(false);
  const [showAddBrandSheet, setShowAddBrandSheet] = useState(false);
  const [showDeveloperSheet, setShowDeveloperSheet] = useState(false);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showBeanTemplatesSheet, setShowBeanTemplatesSheet] = useState(false);
  const [showBrewTemplatesSheet, setShowBrewTemplatesSheet] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [customCoffeeTypes, setCustomCoffeeTypes] = useState<CustomCoffeeType[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem("cafino-online-custom-types");
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as CustomCoffeeType[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [newCoffeeTypeDraft, setNewCoffeeTypeDraft] = useState({
    name: "",
    order: "",
    emoji: "☕",
    caffeine: 75,
    sugar: 0,
  });
  const [beanTemplates, setBeanTemplates] = useState<BeanTemplate[]>(DEFAULT_BEAN_TEMPLATES);
  const [brewTemplates, setBrewTemplates] = useState<BrewTemplate[]>(DEFAULT_BREW_TEMPLATES);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [brandDraft, setBrandDraft] = useState({
    name: "",
    order: "",
    logo: null as string | null,
    cutout: false,
  });
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth());
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("week");
  const [statsWeekOffset, setStatsWeekOffset] = useState(0);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installingApp, setInstallingApp] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [dismissedIosInstallHint, setDismissedIosInstallHint] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const dragRef = useRef<{ id: string | null; startX: number; base: number; pointerId: number | null }>({
    id: null,
    startX: 0,
    base: 0,
    pointerId: null,
  });
  const statsChartHostRef = useRef<HTMLDivElement | null>(null);
  const [statsChartReady, setStatsChartReady] = useState(false);
  const allCoffeeTypes = useMemo<CoffeeTypeOption[]>(() => {
    const custom = [...customCoffeeTypes]
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id,
        label: item.label,
        emoji: item.emoji,
        caffeine: item.caffeine,
        sugar: item.sugar,
        isCustom: true,
      }));

    const base = COFFEE_TYPES.filter((item) => item.id !== "others");
    const others = COFFEE_TYPES.find((item) => item.id === "others");
    return others ? [...base, ...custom, others] : [...base, ...custom];
  }, [customCoffeeTypes]);

  const findCoffeeType = (id: string | undefined) => allCoffeeTypes.find((item) => item.id === id) ?? allCoffeeTypes[0] ?? COFFEE_TYPES[0];

  const safePreferredType = findCoffeeType(preferredType).id as CoffeeTypeId;
  const [draft, setDraft] = useState<DraftState>(defaultDraft(todayKey(), safePreferredType));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("cafino-online-custom-types", JSON.stringify(customCoffeeTypes));
  }, [customCoffeeTypes]);

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
  const selectedDateShort = selectedDateLabel.split(", ").slice(1).join(", ") || selectedDateLabel;
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
  const weeklyCupView = useMemo(() => {
    const now = new Date();
    const baseWeekStart = startOfWeek(now);
    const weekStart = new Date(baseWeekStart);
    weekStart.setDate(baseWeekStart.getDate() - statsWeekOffset * 7);

    const weekDates = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + idx);
      return date;
    });

    const weekKeys = new Set(
      weekDates.map((date) => dateKey(date.getFullYear(), date.getMonth(), date.getDate())),
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekLogs = logs
      .filter((entry) => weekKeys.has(entry.date))
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    return {
      start: weekStart,
      end: weekEnd,
      label: formatWeekRange(weekStart, weekEnd),
      logs: weekLogs,
    };
  }, [logs, statsWeekOffset]);
  const showIosInstallHint = isIosSafari && !isStandaloneMode && !dismissedIosInstallHint;

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
    if (activeTab !== "stats") {
      setStatsChartReady(false);
      return;
    }

    const host = statsChartHostRef.current;
    if (!host) {
      setStatsChartReady(false);
      return;
    }

    const updateReady = () => {
      setStatsChartReady(host.clientWidth > 0 && host.clientHeight > 0);
    };

    updateReady();

    if (typeof ResizeObserver === "undefined") {
      setStatsChartReady(true);
      return;
    }

    const observer = new ResizeObserver(updateReady);
    observer.observe(host);

    return () => {
      observer.disconnect();
    };
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

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
        homemadeBrand: existing.homemadeBrand ?? "Others",
        beanName: existing.beanName ?? "",
        beanOrigin: existing.beanOrigin ?? "",
        beanRoast: existing.beanRoast ?? "",
        beanFlavor: existing.beanFlavor ?? "",
        brewMethod: existing.brewMethod ?? "",
        brewGrind: existing.brewGrind ?? "",
        brewDose: existing.brewDose ?? 0,
        brewWater: existing.brewWater ?? 0,
        brewTime: existing.brewTime ?? 0,
        brewTimeUnit: existing.brewTimeUnit ?? "m",
        brewNotes: existing.brewNotes ?? "",
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

  const openAddAnother = (targetDate: string) => {
    setSelectedDate(targetDate);
    setDraft(defaultDraft(targetDate, safePreferredType));
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
      homemadeBrand: draft.homemade ? draft.homemadeBrand : "",
      beanName: draft.homemade ? draft.beanName : "",
      beanOrigin: draft.homemade ? draft.beanOrigin : "",
      beanRoast: draft.homemade ? draft.beanRoast : "",
      beanFlavor: draft.homemade ? draft.beanFlavor : "",
      brewMethod: draft.homemade ? draft.brewMethod : "",
      brewGrind: draft.homemade ? draft.brewGrind : "",
      brewDose: draft.homemade ? draft.brewDose : 0,
      brewWater: draft.homemade ? draft.brewWater : 0,
      brewTime: draft.homemade ? draft.brewTime : 0,
      brewTimeUnit: draft.homemade ? draft.brewTimeUnit : "m",
      brewNotes: draft.homemade ? draft.brewNotes : "",
      date: draft.selectedDate,
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
  };

  const applyBeanTemplate = (template: BeanTemplate) => {
    setDraft((prev) => ({
      ...prev,
      homemade: true,
      beanName: template.name,
      beanOrigin: template.origin,
      beanRoast: template.roast,
      beanFlavor: template.flavor,
    }));
    setShowBeanTemplatesSheet(false);
  };

  const applyBrewTemplate = (template: BrewTemplate) => {
    setDraft((prev) => ({
      ...prev,
      homemade: true,
      brewMethod: template.method,
      brewGrind: template.grind,
      brewDose: template.dose,
      brewWater: template.water,
      brewTime: template.time,
      brewTimeUnit: template.unit,
    }));
    setShowBrewTemplatesSheet(false);
  };

  const onSaveCurrentBeanTemplate = () => {
    const next: BeanTemplate = {
      id: `bean-custom-${Date.now()}`,
      name: draft.beanName.trim() || `Custom Bean ${beanTemplates.length + 1}`,
      origin: draft.beanOrigin.trim() || "Custom Origin",
      roast: draft.beanRoast || "Medium",
      flavor: draft.beanFlavor.trim() || "Flavor notes",
    };
    setBeanTemplates((prev) => [next, ...prev]);
  };

  const onSaveCurrentBrewTemplate = () => {
    const next: BrewTemplate = {
      id: `brew-custom-${Date.now()}`,
      label: draft.brewMethod.trim() || `Custom Brew ${brewTemplates.length + 1}`,
      method: draft.brewMethod.trim() || "Pour Over",
      grind: draft.brewGrind.trim() || "Medium",
      dose: draft.brewDose || 15,
      water: draft.brewWater || 250,
      time: draft.brewTime || 2,
      unit: draft.brewTimeUnit,
    };
    setBrewTemplates((prev) => [next, ...prev]);
  };

  const onTypeChange = (nextType: CoffeeTypeId) => {
    if (nextType === "others") {
      setShowNewCoffeeTypeSheet(true);
      return;
    }

    const info = findCoffeeType(nextType);
    setDraft((prev) => ({
      ...prev,
      type: nextType,
      name: prev.name || info.label,
      sugar: info.isCustom ? (info.sugar ?? prev.sugar) : prev.sugar,
      caffeine: Math.round(info.caffeine * (SIZE_CAFFEINE[prev.size] ?? 1)),
    }));
  };

  const onSizeChange = (nextSize: string) => {
    const info = findCoffeeType(draft.type);
    setDraft((prev) => ({
      ...prev,
      size: nextSize,
      caffeine: Math.round(info.caffeine * (SIZE_CAFFEINE[nextSize] ?? 1)),
    }));
  };

  const onSaveNewCoffeeType = () => {
    const trimmedName = newCoffeeTypeDraft.name.trim();
    if (!trimmedName) {
      return;
    }

    const normalizedEmoji = newCoffeeTypeDraft.emoji.trim();

    const id = `custom-${Date.now()}`;
    const order = Number(newCoffeeTypeDraft.order) || customCoffeeTypes.length + 10;
    const customType: CustomCoffeeType = {
      id,
      label: trimmedName,
      emoji: normalizedEmoji || "☕",
      order,
      caffeine: Math.max(0, Math.min(500, newCoffeeTypeDraft.caffeine)),
      sugar: Math.max(0, Math.min(100, newCoffeeTypeDraft.sugar)),
    };

    setCustomCoffeeTypes((prev) => [...prev, customType]);
    setDraft((prev) => ({
      ...prev,
      type: customType.id,
      name: trimmedName,
      caffeine: Math.round(customType.caffeine * (SIZE_CAFFEINE[prev.size] ?? 1)),
      sugar: customType.sugar,
    }));
    setShowNewCoffeeTypeSheet(false);
    setNewCoffeeTypeDraft({ name: "", order: "", emoji: "☕", caffeine: 75, sugar: 0 });
  };

  const onSwipeStart = (id: string, clientX: number, pointerId: number) => {
    dragRef.current = {
      id,
      startX: clientX,
      base: swipeOffsets[id] ?? 0,
      pointerId,
    };
  };

  const onSwipeMove = (clientX: number, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag.id || drag.pointerId !== pointerId) {
      return;
    }

    const nextOffset = Math.max(-ACTION_WIDTH, Math.min(0, drag.base + clientX - drag.startX));
    setSwipeOffsets({ [drag.id]: nextOffset });
  };

  const onSwipeEnd = (pointerId?: number) => {
    const drag = dragRef.current;
    if (!drag.id || (typeof pointerId === "number" && drag.pointerId !== pointerId)) {
      return;
    }

    const value = swipeOffsets[drag.id] ?? 0;
    setSwipeOffsets(value <= -ACTION_WIDTH / 3 ? { [drag.id]: -ACTION_WIDTH } : {});
    dragRef.current = { id: null, startX: 0, base: 0, pointerId: null };
  };

  const buildShareCardImage = async (payload: ShareCardPayload, sticker?: ShareCardSticker) => {
    if (typeof document === "undefined") {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    const accent = activeThemeChoice.accent;
    const soft = activeThemeChoice.soft;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, soft);
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.roundRect(58, 58, canvas.width - 116, canvas.height - 116, 52);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.font = "700 68px Georgia";
    ctx.fillText(payload.title, 106, 190);

    ctx.fillStyle = "#5a5a5a";
    ctx.font = "500 36px Inter, Segoe UI, sans-serif";
    ctx.fillText(payload.subtitle, 106, 250);

    if (sticker) {
      const stickerSize = 214;
      const stickerX = canvas.width - stickerSize - 108;
      const stickerY = 118;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(stickerX, stickerY, stickerSize, stickerSize, 42);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(stickerX, stickerY, stickerSize, stickerSize, 42);
      ctx.stroke();

      const stickerImageSrc = sticker.imageSrc;

      if (stickerImageSrc) {
        try {
          const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load sticker image"));
            img.src = stickerImageSrc;
          });

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(stickerX + 10, stickerY + 10, stickerSize - 20, stickerSize - 20, 36);
          ctx.clip();
          ctx.drawImage(image, stickerX + 10, stickerY + 10, stickerSize - 20, stickerSize - 20);
          ctx.restore();
        } catch {
          ctx.fillStyle = accent;
          ctx.font = "700 116px Inter, Segoe UI Emoji, sans-serif";
          ctx.fillText(sticker.emoji ?? "☕", stickerX + 54, stickerY + 145);
        }
      } else {
        ctx.fillStyle = accent;
        ctx.font = "700 116px Inter, Segoe UI Emoji, sans-serif";
        ctx.fillText(sticker.emoji ?? "☕", stickerX + 54, stickerY + 145);
      }

      ctx.fillStyle = "#606060";
      ctx.font = "600 24px Inter, Segoe UI, sans-serif";
      ctx.fillText(sticker.label, stickerX + 16, stickerY + stickerSize + 30);
    }

    const cardStartY = 350;
    const cardHeight = 145;
    const cardGap = 18;

    payload.highlights.slice(0, 6).forEach((item, idx) => {
      const y = cardStartY + idx * (cardHeight + cardGap);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.roundRect(98, y, canvas.width - 196, cardHeight, 28);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(98, y, canvas.width - 196, cardHeight, 28);
      ctx.stroke();

      ctx.fillStyle = "#7a7a7a";
      ctx.font = "500 30px Inter, Segoe UI, sans-serif";
      ctx.fillText(item.label, 132, y + 55);

      ctx.fillStyle = "#242424";
      ctx.font = "700 42px Inter, Segoe UI, sans-serif";
      ctx.fillText(item.value, 132, y + 106);
    });

    if (payload.caption) {
      ctx.fillStyle = "#666";
      ctx.font = "500 30px Inter, Segoe UI, sans-serif";
      ctx.fillText(payload.caption, 106, canvas.height - 130);
    }

    if (shareCards) {
      ctx.fillStyle = accent;
      ctx.font = "700 28px Inter, Segoe UI, sans-serif";
      ctx.fillText("Made with Cafino", canvas.width - 330, canvas.height - 84);
    }

    return canvas.toDataURL("image/png");
  };

  const shareCard = async ({
    title,
    text,
    imageDataUrl,
    filename,
  }: {
    title: string;
    text: string;
    imageDataUrl: string | null;
    filename: string;
  }) => {
    if (typeof navigator !== "undefined" && navigator.share && imageDataUrl) {
      try {
        const blob = await fetch(imageDataUrl).then((response) => response.blob());
        const file = new File([blob], filename, { type: "image/png" });

        if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text, files: [file] });
          return;
        }
      } catch {
        // Fallbacks below handle share incompatibilities.
      }
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // Continue to clipboard/download fallback.
      }
    }

    if (imageDataUrl && typeof document !== "undefined") {
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const onEditEntry = (id: string) => {
    const target = logs.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const type = findCoffeeType(target.type).id as CoffeeTypeId;
    setDraft({
      editingId: target.id,
      selectedDate: target.date,
      type,
      size: target.size,
      temp: target.temp,
      name: target.name,
      caffeine: target.caffeine,
      sugar: target.sugar,
      price: target.price,
      photo: target.photo,
      homemade: target.homemade,
      homemadeBrand: target.homemadeBrand ?? "Others",
      beanName: target.beanName ?? "",
      beanOrigin: target.beanOrigin ?? "",
      beanRoast: target.beanRoast ?? "",
      beanFlavor: target.beanFlavor ?? "",
      brewMethod: target.brewMethod ?? "",
      brewGrind: target.brewGrind ?? "",
      brewDose: target.brewDose ?? 0,
      brewWater: target.brewWater ?? 0,
      brewTime: target.brewTime ?? 0,
      brewTimeUnit: target.brewTimeUnit ?? "m",
      brewNotes: target.brewNotes ?? "",
      note: target.note,
      homeDisplay: target.homeDisplay,
    });
    setSelectedDate(target.date);
    setShowAdd(true);
    setSwipeOffsets({});
  };

  const onDeleteEntry = (id: string) => {
    removeLog(id);
    setSwipeOffsets({});
  };

  const onShareCupCard = async (id: string) => {
    const target = logs.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const typeInfo = findCoffeeType(target.type);
    const title = `${target.name || typeInfo.label} Card`;
    const subtitle = `${formatDateCard(target.date)} · ${formatTime(target.createdAt)}`;
    const text = `${target.name || typeInfo.label} · ${target.temp} · ${target.size} · ${target.caffeine} mg`;

    const imageDataUrl = await buildShareCardImage(
      {
      title,
      subtitle,
      highlights: [
        { label: "Drink", value: target.name || typeInfo.label },
        { label: "Temperature", value: target.temp },
        { label: "Size", value: target.size },
        { label: "Caffeine", value: `${target.caffeine} mg` },
        { label: "Sugar", value: `${target.sugar} g` },
        { label: "Spend", value: formatPeso(target.price) },
      ],
      caption: target.note ? `Note: ${target.note}` : "Your coffee moment, captured.",
      },
      {
        imageSrc: target.photo,
        emoji: typeInfo.emoji,
        label: target.name || typeInfo.label,
      },
    );

    await shareCard({
      title,
      text,
      imageDataUrl,
      filename: `cafino-cup-${target.date}.png`,
    });
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
      `Spend: ${formatPeso(totalSpend)}`,
    ].join("\n");

    const statsTopDrink = statsLogs[statsLogs.length - 1];
    const topTypeInfo = findCoffeeType(statsTopDrink?.type);

    const imageDataUrl = await buildShareCardImage(
      {
        title: `Cafino ${reportLabel}`,
        subtitle: `${MONTH_SHORT[statsMonth]} ${statsYear}`,
        highlights: [
          { label: "Total Cups", value: String(statsLogs.length) },
          { label: "Total Caffeine", value: `${totalCaffeine} mg` },
          { label: "Total Sugar", value: `${totalSugar} g` },
          { label: "Total Spend", value: formatPeso(totalSpend) },
        ],
        caption: "Track your coffee habit with Cafino.",
      },
      {
        imageSrc: statsTopDrink?.photo,
        emoji: topTypeInfo.emoji,
        label: statsTopDrink?.name || topTypeInfo.label,
      },
    );

    await shareCard({
      title: "Cafino Coffee Report",
      text,
      imageDataUrl,
      filename: `cafino-${statsPeriod}-${statsYear}-${statsMonth + 1}.png`,
    });
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

  const onBrandLogoChange = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBrandDraft((prev) => ({
        ...prev,
        logo: typeof reader.result === "string" ? reader.result : null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetBrandDraft = () => {
    setBrandDraft({
      name: "",
      order: "",
      logo: null,
      cutout: false,
    });
  };

  const onSaveBrand = () => {
    const name = brandDraft.name.trim();
    if (!name) {
      return;
    }

    const order = Number(brandDraft.order) || 0;
    const nextBrand: BrandItem = {
      id: `${Date.now()}-${Math.round(Math.random() * 10000)}`,
      name,
      order,
      logo: brandDraft.logo,
      cutout: brandDraft.cutout,
    };

    setBrands((prev) => [...prev, nextBrand].sort((a, b) => a.order - b.order));
    setShowAddBrandSheet(false);
    resetBrandDraft();
  };

  const onSendFeedback = async () => {
    const message = feedbackText.trim();
    if (!message) {
      return;
    }

    setFeedbackSending(true);
    setFeedbackError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          app: "cafino-online",
          sentAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to send feedback.");
      }

      setFeedbackSent(true);
      setFeedbackText("");
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Unable to send feedback right now.");
      setFeedbackSent(false);
    } finally {
      setFeedbackSending(false);
    }
  };

  const onInstallApp = async () => {
    if (!installPromptEvent) {
      return false;
    }

    setInstallingApp(true);
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    setInstallPromptEvent(null);
    setInstallingApp(false);

    if (choice.outcome === "dismissed") {
      return false;
    }

    return true;
  };

  const onInstallEntry = async () => {
    if (isStandaloneMode) {
      setStarted(true);
      return;
    }

    if (installPromptEvent) {
      const accepted = await onInstallApp();
      if (accepted) {
        router.push("/thank-you-installed");
      }
      return;
    }

    if (isIosSafari) {
      setDismissedIosInstallHint(false);
      return;
    }

    setStarted(true);
  };

  const installCtaLabel = isStandaloneMode
    ? "Open App"
    : installPromptEvent
      ? (installingApp ? "Preparing Install..." : "Install App")
      : isIosSafari
        ? "Install on iPhone"
        : "Install App";

  const onTabChange = (tab: TabName) => {
    if (tab === activeTab) {
      return;
    }
    setActiveTab(tab);
  };

  if (!started) {
    return (
      <main className="cafino-app cafino-compact cafino-frame flex w-full flex-col bg-[var(--cafino-soft)] p-3.5 sm:p-5" style={themeVars}>
        <section className="relative mt-2 overflow-hidden rounded-[32px] border border-[var(--cafino-border)] bg-white p-4 shadow-[0_14px_30px_rgba(43,31,18,0.08)] sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--cafino-soft-strong)] opacity-55" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-[var(--cafino-surface-2)] opacity-70" />

          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--cafino-border)] bg-white shadow-sm sm:h-20 sm:w-20">
              <Image src="/download.png" alt="Cafino logo" width={80} height={80} className="h-full w-full object-cover" priority />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cafino-text-muted)]">Coffee Journal</p>
              <h1 className="cafino-title-xl mt-1 text-[var(--cafino-text)]">Cafino</h1>
              <p className="cafino-text-md mt-1.5 text-[var(--cafino-text-muted)]">Track every cup, monitor caffeine, and keep your coffee routine in one place.</p>
            </div>
          </div>

          <div className="relative mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-[var(--cafino-surface-2)] p-2.5">
              <p className="text-xs font-medium text-[var(--cafino-text-muted)]">Today</p>
              <p className="mt-1 text-lg font-bold text-[var(--cafino-accent-strong)]">Stay Balanced</p>
            </div>
            <div className="rounded-2xl bg-[var(--cafino-surface-2)] p-2.5">
              <p className="text-xs font-medium text-[var(--cafino-text-muted)]">Goal</p>
              <p className="mt-1 text-lg font-bold text-[var(--cafino-accent-strong)]">Smart Sips</p>
            </div>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          {[
            { title: "Quick Logging", copy: "Save every cup in seconds." },
            { title: "Calendar View", copy: "Browse your daily coffee flow." },
            { title: "Deep Stats", copy: "Track caffeine, sugar, and spend." },
            { title: "Share Cards", copy: "Share polished coffee snapshots." },
          ].map((item, idx) => (
            <div key={item.title} className="cafino-surface rounded-3xl border border-[var(--cafino-border)] bg-white p-3 sm:p-3.5">
              <div className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--cafino-soft-alt)] text-[var(--cafino-accent-strong)]">
                {idx === 0 ? <Coffee size={16} /> : idx === 1 ? <Settings size={16} /> : idx === 2 ? <BarChart3 size={16} /> : <Share size={16} />}
              </div>
              <p className="text-base font-bold text-[var(--cafino-text)] sm:text-lg">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--cafino-text-muted)] sm:text-sm">{item.copy}</p>
            </div>
          ))}
        </div>

        <button className="mt-3 h-12 rounded-3xl bg-[var(--cafino-accent)] text-lg font-bold text-white shadow-sm sm:h-14 sm:text-xl" onClick={onInstallEntry} disabled={installingApp}>
          {installCtaLabel}
        </button>

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
    <main className="cafino-app cafino-compact cafino-frame flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--cafino-soft)]" style={themeVars}>
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3 pt-3 sm:px-4 sm:pt-4">
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
                  const info = findCoffeeType(last?.type);
                  const today = new Date();
                  const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  return (
                    <button
                      key={key}
                      className={`flex aspect-square items-center justify-center rounded-full text-sm ${dayLogs.length > 0 ? "bg-[var(--cafino-surface-2)]" : isToday ? "bg-[var(--cafino-soft-strong)] font-semibold" : "bg-[var(--cafino-surface-2)]"} ${selectedDate === key ? "ring-2 ring-[var(--cafino-accent)]" : ""}`}
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
                          <Image src={last.photo} className="h-full w-full rounded-full object-cover" alt="Coffee" width={56} height={56} unoptimized />
                        ) : (
                          <DrinkTypeIcon type={info} size={28} className="h-7 w-7 object-contain" />
                        )
                      ) : day}
                    </button>
                  );
                })}
              </div>
            </div>

            {logsForSelectedDay.length === 0 ? (
              <div className="mb-3.5">
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cafino-accent)] text-base font-semibold text-white sm:h-12 sm:text-lg"
                  onClick={() => openAdd(selectedDate)}
                >
                  <Plus size={22} /> Add Cup
                </button>
              </div>
            ) : (
              <div className="mb-3.5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--cafino-border)] bg-white text-base font-semibold text-[var(--cafino-text)] sm:h-12 sm:text-lg"
                  onClick={() => openAdd(selectedDate)}
                >
                  Edit Cup
                </button>
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cafino-accent)] text-base font-semibold text-white sm:h-12 sm:text-lg"
                  onClick={() => openAddAnother(dayKey)}
                >
                  <Plus size={22} /> Add Another Cup for Today
                </button>
              </div>
            )}

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
              const typeInfo = findCoffeeType(entry.type);
              const offset = swipeOffsets[entry.id] ?? 0;
              return (
                <div key={entry.id} className="relative mb-2 overflow-hidden rounded-2xl">
                  <div className="absolute inset-y-0 right-0 flex">
                    <button className="w-[85px] bg-[var(--cafino-accent)] text-lg font-medium text-white" onClick={() => onEditEntry(entry.id)}>Edit</button>
                    <button className="w-[85px] bg-[var(--cafino-danger)] text-lg font-medium text-white" onClick={() => onDeleteEntry(entry.id)}>Delete</button>
                  </div>

                  <div
                    className="cafino-surface relative flex touch-pan-y items-center gap-3 rounded-2xl bg-white p-3 transition-transform duration-200"
                    style={{ transform: `translateX(${offset}px)` }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      onSwipeStart(entry.id, event.clientX, event.pointerId);
                    }}
                    onPointerMove={(event) => onSwipeMove(event.clientX, event.pointerId)}
                    onPointerUp={(event) => onSwipeEnd(event.pointerId)}
                    onPointerCancel={(event) => onSwipeEnd(event.pointerId)}
                    onPointerLeave={(event) => onSwipeEnd(event.pointerId)}
                  >
                    {entry.photo ? (
                      <Image src={entry.photo} className="h-14 w-14 rounded-xl object-cover" alt="Coffee" width={56} height={56} unoptimized />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--cafino-surface-2)]">
                        <DrinkTypeIcon type={typeInfo} size={42} className="h-10 w-10 object-contain" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{entry.name || typeInfo.label}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">{entry.temp} · {entry.size} · {formatTime(entry.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[var(--cafino-accent-strong)] min-[360px]:text-2xl">{entry.caffeine}</p>
                      <p className="text-xs text-[var(--cafino-text-muted)]">mg</p>
                      <button
                        className="mt-1 rounded-full border border-[var(--cafino-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cafino-accent-strong)]"
                        onClick={() => onShareCupCard(entry.id)}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {todayLogs.length > 0 && (
              <div className="mx-auto mt-2 inline-flex rounded-full bg-[var(--cafino-soft-strong)] px-5 py-2 text-sm font-semibold text-[var(--cafino-text)]">
                Swipe left to edit/delete record
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

            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cafino-soft-alt)] text-[var(--cafino-text-muted)] disabled:opacity-40"
                  onClick={() => setStatsWeekOffset((value) => value + 1)}
                  aria-label="Previous week"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="inline-flex rounded-3xl bg-[var(--cafino-soft-strong)] px-4 py-3 text-center text-sm font-semibold text-[var(--cafino-text)] sm:px-5 sm:text-base">
                  Weekly Cups: {weeklyCupView.label}
                </div>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cafino-soft-alt)] text-[var(--cafino-text-muted)] disabled:opacity-40"
                  onClick={() => setStatsWeekOffset((value) => Math.max(0, value - 1))}
                  disabled={statsWeekOffset === 0}
                  aria-label="Next week"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="relative mb-4 h-56 w-full overflow-hidden rounded-3xl bg-white p-3 sm:h-60 sm:p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_45%)]" />
                {weeklyCupView.logs.length === 0 ? (
                  <div className="relative flex h-full items-center justify-center rounded-2xl bg-[var(--cafino-surface-2)] px-4 text-center text-sm font-medium text-[var(--cafino-text-muted)]">
                    No cups logged this week yet.
                  </div>
                ) : (
                  <div className="relative flex h-full items-end gap-3 overflow-x-auto overflow-y-hidden pr-1">
                    {weeklyCupView.logs.map((entry, idx) => {
                      const typeInfo = findCoffeeType(entry.type);

                      return (
                        <div
                          key={entry.id}
                          className="cafino-cup-sway flex h-40 min-w-[6.2rem] shrink-0 items-center justify-center"
                          style={{
                            animationDelay: `${(idx % 8) * 0.22}s`,
                            animationDuration: `${4.6 + (idx % 5) * 0.35}s`,
                          }}
                          title={`${entry.name || typeInfo.label} · ${formatTime(entry.createdAt)}`}
                        >
                          <div className="cafino-drink-sticker">
                            {entry.photo ? (
                              <Image
                                src={entry.photo}
                                alt={entry.name || typeInfo.label}
                                width={124}
                                height={124}
                                className="h-28 w-28 object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-28 w-28 items-center justify-center">
                                <DrinkTypeIcon type={typeInfo} size={108} className="h-24 w-24 object-contain" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>

            <div className="cafino-surface mb-4 rounded-3xl bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Cups</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{statsLogs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--cafino-text)] min-[360px]:text-base sm:text-lg">Total Spend</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--cafino-accent)] min-[360px]:text-4xl sm:text-5xl">{formatPeso(statsLogs.reduce((s, l) => s + l.price, 0))}</p>
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
              <div ref={statsChartHostRef} className="h-48 w-full min-w-0">
                {hasBarData && statsChartReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
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

            <div className="mb-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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
                  <>
                    <Image src={wallpaper} alt="Wallpaper" width={220} height={90} className="mt-3 h-20 w-full rounded-2xl object-cover" unoptimized />
                    <button
                      type="button"
                      className="mt-3 rounded-xl border border-[var(--cafino-border)] px-3 py-2 text-sm font-medium text-[var(--cafino-text-soft)]"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setWallpaper(null);
                      }}
                    >
                      Remove wallpaper
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-[var(--cafino-text-muted)] sm:text-base">No wallpaper selected</p>
                )}
              </label>

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
                onClick={() => setShowBrandSheet(true)}
              >
                <p className="truncate text-xl font-semibold leading-none sm:text-2xl">Brands</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">Manage custom brands</p>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <button
                className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5"
                onClick={() => setShowFeedbackSheet(true)}
              >
                <p className="truncate text-xl font-semibold leading-none sm:text-2xl">Feedback</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">Share ideas and improvements</p>
              </button>

              <button
                className="cafino-surface rounded-[28px] border border-[var(--cafino-border)] bg-white p-4 text-left sm:p-5"
                onClick={() => setShowDeveloperSheet(true)}
              >
                <p className="truncate text-xl font-semibold leading-none sm:text-2xl">About Developer</p>
                <p className="mt-2 text-sm text-[var(--cafino-text-muted)] sm:text-base">Info, feedback, and support</p>
              </button>
            </div>
          </section>
        )}
      </div>

      <nav
        className="mt-auto grid grid-cols-3 gap-1 border-t border-[var(--cafino-border)] bg-[color-mix(in_oklab,var(--cafino-soft)_86%,white)] px-2 pt-2 sm:gap-2 sm:px-3"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        <button
          type="button"
          className={`flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[11px] leading-none min-[360px]:text-xs sm:min-h-[3.1rem] sm:gap-1 ${
            activeTab === "home"
              ? "bg-[var(--cafino-soft-strong)] font-semibold text-[var(--cafino-accent-strong)]"
              : "text-[var(--cafino-text-muted)]"
          }`}
          aria-label="Home"
          onClick={() => onTabChange("home")}
        >
          <Coffee size={22} className="min-[360px]:h-6 min-[360px]:w-6" />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={`flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[11px] leading-none min-[360px]:text-xs sm:min-h-[3.1rem] sm:gap-1 ${
            activeTab === "stats"
              ? "bg-[var(--cafino-soft-strong)] font-semibold text-[var(--cafino-accent-strong)]"
              : "text-[var(--cafino-text-muted)]"
          }`}
          aria-label="Stats"
          onClick={() => onTabChange("stats")}
        >
          <BarChart3 size={22} className="min-[360px]:h-6 min-[360px]:w-6" />
          <span>Stats</span>
        </button>
        <button
          type="button"
          className={`flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[11px] leading-none min-[360px]:text-xs sm:min-h-[3.1rem] sm:gap-1 ${
            activeTab === "settings"
              ? "bg-[var(--cafino-soft-strong)] font-semibold text-[var(--cafino-accent-strong)]"
              : "text-[var(--cafino-text-muted)]"
          }`}
          aria-label="Settings"
          onClick={() => onTabChange("settings")}
        >
          <Settings size={22} className="min-[360px]:h-6 min-[360px]:w-6" />
          <span>Settings</span>
        </button>
      </nav>

      {showBrandSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-[#efeeec] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#efeeec] px-4 py-3 sm:px-5">
              <button className="text-2xl text-[var(--cafino-text-muted)]" onClick={() => setShowBrandSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)]">Brands</p>
              <span className="w-16" />
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button
                  className="flex h-40 flex-col items-center justify-center rounded-[28px] border border-[var(--cafino-border)] bg-white"
                  onClick={() => {
                    resetBrandDraft();
                    setShowAddBrandSheet(true);
                  }}
                >
                  <Plus size={46} className="text-[var(--cafino-text-soft)]" />
                  <p className="mt-2 text-2xl font-medium text-[var(--cafino-text)]">Others</p>
                </button>

                {brands.map((brand) => (
                  <div key={brand.id} className="flex h-40 flex-col items-center justify-center rounded-[28px] border border-[var(--cafino-border)] bg-white p-3 text-center">
                    {brand.logo ? (
                      <Image src={brand.logo} alt={brand.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover" unoptimized />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cafino-soft-alt)] text-2xl font-semibold text-[var(--cafino-text-soft)]">
                        {brand.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <p className="mt-2 line-clamp-1 text-lg font-medium text-[var(--cafino-text)]">{brand.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBrandSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-[#efeeec] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#efeeec] px-4 py-3 sm:px-5">
              <button
                className="text-2xl text-[var(--cafino-text-muted)]"
                onClick={() => {
                  setShowAddBrandSheet(false);
                  resetBrandDraft();
                }}
              >
                Cancel
              </button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)]">Add Brand</p>
              <button
                className="text-2xl font-medium text-[var(--cafino-accent-strong)] disabled:opacity-40"
                onClick={onSaveBrand}
                disabled={!brandDraft.name.trim()}
              >
                Save
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--cafino-text-muted)]">Logo</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--cafino-text-muted)]">Cutout</p>
                  <button
                    className={`h-9 w-16 rounded-full ${brandDraft.cutout ? "bg-[var(--cafino-accent)]" : "bg-[var(--cafino-soft-alt)]"}`}
                    onClick={() => setBrandDraft((prev) => ({ ...prev, cutout: !prev.cutout }))}
                  >
                    <span className={`block h-8 w-8 rounded-full bg-white transition-transform ${brandDraft.cutout ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              <label className="block cursor-pointer rounded-3xl bg-white p-4">
                <div className="rounded-[28px] border-2 border-dashed border-[var(--cafino-border)] p-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f4ef] text-[#9a855f]">
                    <Camera size={30} />
                  </div>
                  <p className="text-3xl font-medium text-[var(--cafino-text-soft)]">Add Photo</p>
                  <p className="mt-1 text-lg text-[var(--cafino-text-muted)]">Brand Logo</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => onBrandLogoChange(event.target.files?.[0])} />
              </label>

              {brandDraft.logo ? (
                <Image src={brandDraft.logo} alt="Brand logo" width={400} height={160} className="h-28 w-full rounded-3xl object-cover" unoptimized />
              ) : null}

              <div className="rounded-3xl bg-white p-4">
                <label className="mb-4 block">
                  <p className="mb-2 text-2xl font-medium text-[var(--cafino-text)]">Name</p>
                  <input
                    className="w-full rounded-2xl border border-[var(--cafino-border)] px-4 py-3 text-xl"
                    placeholder="eg. Starbucks"
                    value={brandDraft.name}
                    onChange={(event) => setBrandDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>

                <label className="block">
                  <p className="mb-2 text-2xl font-medium text-[var(--cafino-text)]">Order</p>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-[var(--cafino-border)] px-4 py-3 text-xl"
                    placeholder="eg. 0, 99"
                    value={brandDraft.order}
                    onChange={(event) => setBrandDraft((prev) => ({ ...prev, order: event.target.value }))}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeveloperSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-[#efeeec] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#efeeec] px-4 py-3 sm:px-5">
              <button className="text-2xl text-[var(--cafino-text-muted)]" onClick={() => setShowDeveloperSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)]">About Developer</p>
              <span className="w-16" />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <section className="rounded-3xl bg-white p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <Image src="/download.png" alt="Developer" width={72} height={72} className="h-18 w-18 rounded-2xl object-cover" unoptimized />
                  <div>
                    <p className="text-2xl font-semibold text-[var(--cafino-text)]">{DEV_NAME}</p>
                    <p className="mt-1 text-sm text-[var(--cafino-text-muted)]">Zentari</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[var(--cafino-soft-alt)] p-3">
                    <p className="font-medium text-[var(--cafino-text-soft)]">Role</p>
                    <p className="mt-1 text-[var(--cafino-text-muted)]">{DEV_ROLE}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--cafino-soft-alt)] p-3">
                    <p className="font-medium text-[var(--cafino-text-soft)]">Location</p>
                    <p className="mt-1 text-[var(--cafino-text-muted)]">{DEV_LOCATION}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <a
                    href={`mailto:${DEV_EMAIL}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--cafino-accent)] px-4 py-2 text-sm font-semibold text-[var(--cafino-accent-strong)]"
                  >
                    Contact me via email
                  </a>
                  <a
                    href={DEV_PORTFOLIO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl bg-[var(--cafino-accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Visit my portfolio
                  </a>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="text-[var(--cafino-accent)]" size={18} />
                  <p className="text-xl font-semibold text-[var(--cafino-text)]">Buy Me a Matcha</p>
                </div>
                <p className="text-sm text-[var(--cafino-text-muted)]">If Cafino helps your daily routine, you can support development with a small donation.</p>
                <a
                  href={DONATION_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-[var(--cafino-accent)] px-4 py-2 text-sm font-semibold text-[var(--cafino-accent-strong)]"
                >
                  <UserRound size={16} /> Donate
                </a>
                <p className="mt-2 text-xs text-[var(--cafino-text-subtle)]">Replace donation link in code when your final page is ready.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {showFeedbackSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-[#efeeec] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#efeeec] px-4 py-3 sm:px-5">
              <button className="text-2xl text-[var(--cafino-text-muted)]" onClick={() => setShowFeedbackSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)]">Feedback</p>
              <span className="w-16" />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <section className="rounded-3xl bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="text-[var(--cafino-accent)]" size={18} />
                  <p className="text-xl font-semibold text-[var(--cafino-text)]">Tell us what to improve</p>
                </div>
                <textarea
                  value={feedbackText}
                  onChange={(event) => {
                    setFeedbackText(event.target.value);
                    if (feedbackSent) {
                      setFeedbackSent(false);
                    }
                    if (feedbackError) {
                      setFeedbackError(null);
                    }
                  }}
                  placeholder="Tell me what to improve, what you love, and what you want next..."
                  className="min-h-28 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3"
                />
                {feedbackSent ? <p className="mt-2 text-sm text-[var(--cafino-accent-strong)]">Thanks! Feedback sent successfully.</p> : null}
                {feedbackError ? <p className="mt-2 text-sm text-[var(--cafino-danger)]">{feedbackError}</p> : null}
                <button className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--cafino-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={onSendFeedback} disabled={feedbackSending || !feedbackText.trim()}>
                  <SendHorizontal size={16} /> {feedbackSending ? "Sending..." : "Send Feedback"}
                </button>
              </section>
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
                const typeInfo = findCoffeeType(entry.type);
                return (
                  <div key={`detail-${entry.id}`} className="cafino-surface mb-2 flex items-center gap-3 rounded-2xl bg-white p-3">
                    {entry.photo ? (
                      <Image src={entry.photo} className="h-14 w-14 rounded-xl object-cover" alt="Coffee" width={56} height={56} unoptimized />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--cafino-surface-2)]">
                        <DrinkTypeIcon type={typeInfo} size={42} className="h-10 w-10 object-contain" />
                      </div>
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

              {draft.homemade && (
                <>
                  <div className="rounded-3xl border border-[var(--cafino-border)] bg-white p-4">
                    <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Brand</label>
                    <div className="flex flex-wrap gap-2">
                      {["Others", ...brands.map((item) => item.name)].map((name) => (
                        <button
                          key={`homemade-brand-${name}`}
                          className={`rounded-xl border px-3 py-2 text-sm ${draft.homemadeBrand === name ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-soft-strong)] text-[var(--cafino-accent-strong)]" : "border-[var(--cafino-border)] bg-white text-[var(--cafino-text)]"}`}
                          onClick={() => setDraft((prev) => ({ ...prev, homemadeBrand: name }))}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[var(--cafino-border)] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold">Coffee Beans</p>
                      <button
                        className="rounded-full border border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-3 py-1 text-base font-medium text-[var(--cafino-accent-strong)]"
                        onClick={() => setShowBeanTemplatesSheet(true)}
                      >
                        Templates
                      </button>
                    </div>

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Bean</label>
                    <input
                      value={draft.beanName}
                      onChange={(e) => setDraft((prev) => ({ ...prev, beanName: e.target.value }))}
                      placeholder="e.g., Ethiopian Yirgacheffe"
                      className="mb-3 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                    />

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Origin</label>
                    <input
                      value={draft.beanOrigin}
                      onChange={(e) => setDraft((prev) => ({ ...prev, beanOrigin: e.target.value }))}
                      placeholder="e.g., Ethiopia, Colombia"
                      className="mb-3 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                    />

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Roast</label>
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      {(["Light", "Medium", "Dark"] as RoastLevel[]).map((roast) => (
                        <button
                          key={roast}
                          className={`rounded-xl border px-2 py-2 text-sm ${draft.beanRoast === roast ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`}
                          onClick={() => setDraft((prev) => ({ ...prev, beanRoast: roast }))}
                        >
                          {roast}
                        </button>
                      ))}
                    </div>

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Flavor</label>
                    <input
                      value={draft.beanFlavor}
                      onChange={(e) => setDraft((prev) => ({ ...prev, beanFlavor: e.target.value }))}
                      placeholder="e.g., citrus, floral, chocolate"
                      className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                    />
                  </div>

                  <div className="rounded-3xl border border-[var(--cafino-border)] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold">Brewing Details</p>
                      <button
                        className="rounded-full border border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-3 py-1 text-base font-medium text-[var(--cafino-accent-strong)]"
                        onClick={() => setShowBrewTemplatesSheet(true)}
                      >
                        Templates
                      </button>
                    </div>

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Method</label>
                    <input
                      value={draft.brewMethod}
                      onChange={(e) => setDraft((prev) => ({ ...prev, brewMethod: e.target.value }))}
                      placeholder="e.g., V60, French Press, AeroPress"
                      className="mb-3 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                    />

                    <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Grind</label>
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {["Extra Fine", "Fine", "Medium Fine", "Medium", "Medium Coarse", "Coarse"].map((grind) => (
                        <button
                          key={grind}
                          className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${draft.brewGrind === grind ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`}
                          onClick={() => setDraft((prev) => ({ ...prev, brewGrind: grind }))}
                        >
                          {grind}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Dose (g)</label>
                        <input
                          type="number"
                          value={draft.brewDose || ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, brewDose: Number(e.target.value) || 0 }))}
                          className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--cafino-text)]">Water (ml)</label>
                        <input
                          type="number"
                          value={draft.brewWater || ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, brewWater: Number(e.target.value) || 0 }))}
                          className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3"
                        />
                      </div>
                    </div>

                    <label className="mb-2 mt-3 block text-sm font-medium text-[var(--cafino-text)]">Brew Time</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="number"
                        value={draft.brewTime || ""}
                        onChange={(e) => setDraft((prev) => ({ ...prev, brewTime: Number(e.target.value) || 0 }))}
                        className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3"
                      />
                      <select
                        value={draft.brewTimeUnit}
                        onChange={(e) => setDraft((prev) => ({ ...prev, brewTimeUnit: e.target.value as BrewTimeUnit }))}
                        className="rounded-2xl border border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-3 py-3"
                      >
                        <option value="s">s</option>
                        <option value="m">m</option>
                        <option value="h">h</option>
                      </select>
                    </div>

                    <label className="mb-2 mt-3 block text-sm font-medium text-[var(--cafino-text)]">Brewing Notes</label>
                    <textarea
                      value={draft.brewNotes}
                      onChange={(e) => setDraft((prev) => ({ ...prev, brewNotes: e.target.value }))}
                      placeholder="Brewing technique, observations..."
                      className="min-h-20 w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-3 py-3"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Drink Type</label>
                <div className="overflow-x-auto pb-1">
                  <div className="flex gap-2">
                  {allCoffeeTypes.map((item) => (
                    <button key={item.id} className={`min-w-[86px] rounded-xl border px-2 py-2 text-xs ${draft.type === item.id ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-surface-2)]" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => onTypeChange(item.id)}>
                      <div className="mb-1 flex items-center justify-center">
                        <DrinkTypeIcon type={item} size={26} className="h-6 w-6 object-contain" />
                      </div>
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
                <button className={`rounded-xl border px-2 py-2 ${draft.temp === "Iced" ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => setDraft((prev) => ({ ...prev, temp: "Iced" as TempOption }))}>Iced</button>
                <button className={`rounded-xl border px-2 py-2 ${draft.temp === "Hot" ? "border-[var(--cafino-accent-strong)] bg-[var(--cafino-accent-strong)] text-white" : "border-[var(--cafino-border)] bg-white"}`} onClick={() => setDraft((prev) => ({ ...prev, temp: "Hot" as TempOption }))}>Hot</button>
              </div>

              <label className="block text-xl text-[var(--cafino-text-muted)]">Caffeine: <span className="font-semibold text-[var(--cafino-accent-strong)]">{draft.caffeine} mg</span></label>
              <input type="range" min={0} max={500} value={draft.caffeine} onChange={(e) => setDraft((prev) => ({ ...prev, caffeine: Number(e.target.value) }))} className="w-full" />

              <label className="block text-xl text-[var(--cafino-text-muted)]">Sugar: <span className="font-semibold text-[var(--cafino-accent-strong)]">{draft.sugar} g</span></label>
              <input type="range" min={0} max={100} value={draft.sugar} onChange={(e) => setDraft((prev) => ({ ...prev, sugar: Number(e.target.value) }))} className="w-full" />

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Price (Optional, ₱)</label>
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

      {showBeanTemplatesSheet && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <button className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl" onClick={() => setShowBeanTemplatesSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Select Beans</p>
              <span className="w-12" />
            </div>

            <div className="space-y-3 p-4">
              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3 text-left text-xl font-medium text-[var(--cafino-accent-strong)]"
                onClick={onSaveCurrentBeanTemplate}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cafino-accent)] text-white">
                  <Plus size={18} />
                </span>
                Add New Bean Template
              </button>

              <p className="px-1 text-sm uppercase tracking-[0.16em] text-[var(--cafino-text-muted)]">Bean Templates</p>

              <div className="divide-y divide-[var(--cafino-border)] overflow-hidden rounded-2xl border border-[var(--cafino-border)] bg-white">
                {beanTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full px-4 py-3 text-left"
                    onClick={() => applyBeanTemplate(template)}
                  >
                    <p className="text-2xl font-semibold text-[var(--cafino-text)]">{template.name}</p>
                    <p className="mt-1 text-base text-[var(--cafino-text-muted)]">{template.origin} · {template.roast || "Medium"}</p>
                    <p className="mt-1 text-base text-[var(--cafino-text-muted)]">{template.flavor}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBrewTemplatesSheet && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <button className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl" onClick={() => setShowBrewTemplatesSheet(false)}>Cancel</button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Select Brewing Method</p>
              <span className="w-12" />
            </div>

            <div className="space-y-3 p-4">
              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3 text-left text-xl font-medium text-[var(--cafino-accent-strong)]"
                onClick={onSaveCurrentBrewTemplate}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cafino-accent)] text-white">
                  <Plus size={18} />
                </span>
                Add New Bean Template
              </button>

              <p className="px-1 text-sm uppercase tracking-[0.16em] text-[var(--cafino-text-muted)]">Brew Templates</p>

              <div className="divide-y divide-[var(--cafino-border)] overflow-hidden rounded-2xl border border-[var(--cafino-border)] bg-white">
                {brewTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full px-4 py-3 text-left"
                    onClick={() => applyBrewTemplate(template)}
                  >
                    <p className="text-2xl font-semibold text-[var(--cafino-text)]">{template.label}</p>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-base text-[var(--cafino-text-muted)] min-[420px]:grid-cols-4">
                      <p>Grind: {template.grind}</p>
                      <p>Dose: {template.dose}g</p>
                      <p>Water: {template.water}ml</p>
                      <p>Time: {template.time} {template.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewCoffeeTypeSheet && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <button
                className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl"
                onClick={() => {
                  setShowNewCoffeeTypeSheet(false);
                  setNewCoffeeTypeDraft({ name: "", order: "", emoji: "☕", caffeine: 75, sugar: 0 });
                }}
              >
                Cancel
              </button>
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">New Coffee Type</p>
              <button className="text-xl text-[var(--cafino-accent-strong)] disabled:opacity-40 sm:text-2xl" onClick={onSaveNewCoffeeType} disabled={!newCoffeeTypeDraft.name.trim()}>
                Save
              </button>
            </div>

            <div className="space-y-4 p-4">
              <button className="mx-auto flex w-full max-w-[280px] flex-col items-center" onClick={() => setShowTypeIconSheet(true)}>
                <span className="flex h-44 w-44 items-center justify-center rounded-full bg-[var(--cafino-surface-2)] text-7xl">{newCoffeeTypeDraft.emoji}</span>
                <span className="mt-3 text-xl text-[var(--cafino-text-muted)]">Tap to change icon</span>
              </button>

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Coffee Name</label>
                <input
                  value={newCoffeeTypeDraft.name}
                  onChange={(event) => setNewCoffeeTypeDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g., Cappuccino, Cold Brew"
                  className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[var(--cafino-text-muted)]">Order</label>
                <input
                  type="number"
                  value={newCoffeeTypeDraft.order}
                  onChange={(event) => setNewCoffeeTypeDraft((prev) => ({ ...prev, order: event.target.value }))}
                  placeholder="e.g. 0, 99"
                  className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3"
                />
              </div>

              <div className="rounded-2xl border border-[var(--cafino-border)] bg-white p-4">
                <label className="block text-xl text-[var(--cafino-text-muted)]">Default Caffeine: <span className="font-semibold text-[var(--cafino-accent-strong)]">{newCoffeeTypeDraft.caffeine} mg</span></label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={newCoffeeTypeDraft.caffeine}
                  onChange={(event) => setNewCoffeeTypeDraft((prev) => ({ ...prev, caffeine: Number(event.target.value) }))}
                  className="mt-3 w-full"
                />
              </div>

              <div className="rounded-2xl border border-[var(--cafino-border)] bg-white p-4">
                <label className="block text-xl text-[var(--cafino-text-muted)]">Default Sugar: <span className="font-semibold text-[var(--cafino-accent-strong)]">{newCoffeeTypeDraft.sugar} g</span></label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={newCoffeeTypeDraft.sugar}
                  onChange={(event) => setNewCoffeeTypeDraft((prev) => ({ ...prev, sugar: Number(event.target.value) }))}
                  className="mt-3 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showTypeIconSheet && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/35 p-2">
          <div className="cafino-sheet animate-in slide-in-from-bottom-4 fade-in mx-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[var(--cafino-soft-alt)] duration-300 sm:max-w-[720px]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--cafino-border)] bg-[var(--cafino-soft-alt)] px-4 py-3">
              <span className="w-14" />
              <p className="text-2xl font-semibold text-[var(--cafino-text)] sm:text-3xl">Select Icon</p>
              <button className="text-xl text-[var(--cafino-accent-strong)] sm:text-2xl" onClick={() => setShowTypeIconSheet(false)}>Done</button>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-col items-center">
                <span className="text-8xl">{newCoffeeTypeDraft.emoji}</span>
                <p className="mt-2 text-xl text-[var(--cafino-text-muted)]">Selected Icon</p>
              </div>

              <input
                value={newCoffeeTypeDraft.emoji}
                onChange={(event) => setNewCoffeeTypeDraft((prev) => ({ ...prev, emoji: event.target.value }))}
                placeholder="Other Emoji..."
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-2xl border border-[var(--cafino-border)] bg-white px-4 py-3 text-center text-3xl"
              />
              <p className="text-center text-sm text-[var(--cafino-text-muted)]">Type or paste any emoji.</p>

              <p className="text-2xl font-semibold text-[var(--cafino-text)]">Choose an Icon</p>
              <div className="grid grid-cols-5 gap-2 min-[420px]:grid-cols-6">
                {DEFAULT_TYPE_ICONS.map((emoji) => (
                  <button
                    key={`icon-${emoji}`}
                    className={`flex h-14 items-center justify-center rounded-xl border bg-white text-3xl ${newCoffeeTypeDraft.emoji === emoji ? "border-[3px] border-[var(--cafino-accent-strong)]" : "border-[var(--cafino-border)]"}`}
                    onClick={() => setNewCoffeeTypeDraft((prev) => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
