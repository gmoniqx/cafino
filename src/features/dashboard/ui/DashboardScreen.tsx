"use client";

import { Coffee, Flame, LogOut, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

import { useCafinoStore } from "@/features/cafino/store/useCafinoStore";
import { getThemeChoice } from "@/features/cafino/theme/themes";

const AUTH_SESSION_KEY = "cafino-online-auth";

function toDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DashboardScreen() {
  const router = useRouter();
  const logs = useCafinoStore((state) => state.logs);
  const cafLimit = useCafinoStore((state) => state.cafLimit);
  const setActiveTab = useCafinoStore((state) => state.setActiveTab);
  const themeId = useCafinoStore((state) => state.themeId);
  const activeThemeChoice = getThemeChoice(themeId);
  const themeVars = {
    "--cafino-accent": activeThemeChoice.accent,
    "--cafino-accent-strong": `color-mix(in oklab, ${activeThemeChoice.accent} 84%, black)`,
    "--cafino-text": `color-mix(in oklab, ${activeThemeChoice.accent} 34%, #1a1a1a)`,
    "--cafino-text-soft": `color-mix(in oklab, ${activeThemeChoice.accent} 22%, #2b2b2b)`,
    "--cafino-text-muted": `color-mix(in oklab, ${activeThemeChoice.accent} 26%, #707070)`,
    "--cafino-text-subtle": `color-mix(in oklab, ${activeThemeChoice.accent} 18%, #9a9a9a)`,
    "--cafino-soft": activeThemeChoice.soft,
    "--cafino-soft-alt": `color-mix(in oklab, ${activeThemeChoice.soft} 82%, white)`,
  } as CSSProperties;
  const [isAuthed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(localStorage.getItem(AUTH_SESSION_KEY));
  });

  useEffect(() => {
    if (!isAuthed) {
      router.replace("/login");
    }
  }, [isAuthed, router]);

  const stats = useMemo(() => {
    const today = toDateKey(new Date().toISOString());
    const todayLogs = logs.filter((entry) => entry.date === today);
    const todayCaffeine = todayLogs.reduce((sum, entry) => sum + entry.caffeine, 0);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthlyLogs = logs.filter((entry) => {
      const date = new Date(entry.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    return {
      totalLogs: logs.length,
      monthlyLogs: monthlyLogs.length,
      todayCaffeine,
      caffeinePct: Math.min(100, Math.round((todayCaffeine / Math.max(100, cafLimit)) * 100)),
    };
  }, [logs, cafLimit]);

  const onContinueTracking = (tab: "home" | "stats" | "settings") => {
    setActiveTab(tab);
    router.push("/");
  };

  const onSignOut = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    router.replace("/login");
  };

  if (!isAuthed) {
    return <main className="app-shell bg-[var(--cafino-soft)]" style={themeVars} />;
  }

  return (
    <main
      className="app-shell flex flex-col gap-4"
      style={{
        ...themeVars,
        backgroundImage: `radial-gradient(circle at 85% 5%, color-mix(in oklab, ${activeThemeChoice.accent} 22%, white), ${activeThemeChoice.soft} 42%, color-mix(in oklab, ${activeThemeChoice.soft} 82%, #ddd))`,
      }}
    >
      <header className="app-card animate-in fade-in duration-300 p-5 sm:p-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--cafino-accent)]">Coffee Dashboard</p>
        <h1 className="app-title mt-2 text-[var(--cafino-text)]">Your progress today</h1>
        <p className="app-copy mt-2">All stats update from your local Cafino records in real time.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <article className="app-card p-4">
          <p className="text-sm text-[var(--cafino-text-muted)]">Total Cups</p>
          <p className="mt-1 text-2xl font-bold text-[var(--cafino-accent-strong)] min-[360px]:text-3xl sm:text-4xl">{stats.totalLogs}</p>
        </article>
        <article className="app-card p-4">
          <p className="text-sm text-[var(--cafino-text-muted)]">This Month</p>
          <p className="mt-1 text-2xl font-bold text-[var(--cafino-accent-strong)] min-[360px]:text-3xl sm:text-4xl">{stats.monthlyLogs}</p>
        </article>
      </section>

      <section className="app-card p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between text-sm text-[var(--cafino-text-muted)]">
          <span>Daily Caffeine</span>
          <span>{stats.todayCaffeine} mg</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--cafino-soft-alt)]">
          <div className="h-full rounded-full bg-[var(--cafino-accent)] transition-all duration-500" style={{ width: `${stats.caffeinePct}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-3">
        <button className="app-card flex items-center justify-between p-4 text-left" onClick={() => onContinueTracking("home")}>
          <span className="font-medium text-[var(--cafino-text-soft)]">Track Cups</span>
          <Coffee size={18} className="text-[var(--cafino-accent-strong)]" />
        </button>
        <button className="app-card flex items-center justify-between p-4 text-left" onClick={() => onContinueTracking("stats")}>
          <span className="font-medium text-[var(--cafino-text-soft)]">View Stats</span>
          <Flame size={18} className="text-[var(--cafino-accent-strong)]" />
        </button>
        <button className="app-card flex items-center justify-between p-4 text-left" onClick={() => onContinueTracking("settings")}>
          <span className="font-medium text-[var(--cafino-text-soft)]">Preferences</span>
          <Settings2 size={18} className="text-[var(--cafino-accent-strong)]" />
        </button>
      </section>

      <button className="app-button-primary mt-auto flex w-full items-center justify-center gap-2" onClick={onSignOut}>
        <LogOut size={16} />
        Sign Out
      </button>
    </main>
  );
}
