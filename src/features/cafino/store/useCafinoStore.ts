"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TabName = "home" | "stats" | "settings";

export interface CoffeeLog {
  id: string;
  type: string;
  name: string;
  size: string;
  temp: "Iced" | "Hot";
  homemade: boolean;
  caffeine: number;
  sugar: number;
  price: number;
  note: string;
  homeDisplay: boolean;
  photo: string | null;
  date: string;
  createdAt: string;
}

export type ThemeId =
  | "coffee-brown"
  | "peach-cream"
  | "graphite-gray"
  | "pink-ribbon"
  | "midnight-mocha"
  | "creamy-matcha"
  | "butter-cookie"
  | "sunset-vibe"
  | "blueberry-haze";

interface CafinoState {
  started: boolean;
  cafLimit: number;
  activeTab: TabName;
  shareCards: boolean;
  brandManage: boolean;
  themeId: ThemeId;
  preferredType: string;
  wallpaper: string | null;
  logs: CoffeeLog[];
  setStarted: (started: boolean) => void;
  setCafLimit: (value: number) => void;
  setActiveTab: (tab: TabName) => void;
  setShareCards: (value: boolean) => void;
  setBrandManage: (value: boolean) => void;
  setThemeId: (themeId: ThemeId) => void;
  setPreferredType: (type: string) => void;
  setWallpaper: (value: string | null) => void;
  upsertLog: (entry: CoffeeLog) => void;
  removeLog: (id: string) => void;
}

export const useCafinoStore = create<CafinoState>()(
  persist(
    (set) => ({
      started: false,
      cafLimit: 400,
      activeTab: "home",
      shareCards: true,
      brandManage: false,
      themeId: "coffee-brown",
      preferredType: "espresso",
      wallpaper: null,
      logs: [],
      setStarted: (started) => set({ started }),
      setCafLimit: (value) => set({ cafLimit: Math.min(800, Math.max(100, value)) }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setShareCards: (value) => set({ shareCards: value }),
      setBrandManage: (value) => set({ brandManage: value }),
      setThemeId: (themeId) => set({ themeId }),
      setPreferredType: (preferredType) => set({ preferredType }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      upsertLog: (entry) =>
        set((state) => {
          const existingIndex = state.logs.findIndex((item) => item.id === entry.id);
          if (existingIndex === -1) {
            return { logs: [...state.logs, entry] };
          }

          const next = [...state.logs];
          next[existingIndex] = entry;
          return { logs: next };
        }),
      removeLog: (id) => set((state) => ({ logs: state.logs.filter((item) => item.id !== id) })),
    }),
    {
      name: "cafino-online-local",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        started: state.started,
        cafLimit: state.cafLimit,
        shareCards: state.shareCards,
        brandManage: state.brandManage,
        themeId: state.themeId,
        preferredType: state.preferredType,
        wallpaper: state.wallpaper,
        logs: state.logs,
      }),
    },
  ),
);
