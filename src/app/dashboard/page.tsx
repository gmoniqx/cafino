import type { Metadata } from "next";

import { DashboardScreen } from "@/features/dashboard/ui/DashboardScreen";

export const metadata: Metadata = {
  title: "Dashboard | Cafino",
  description: "Track your coffee progress with mobile-friendly caffeine, sugar, and cup insights.",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
