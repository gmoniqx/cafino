import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/ui/LoginScreen";

export const metadata: Metadata = {
  title: "Login | Cafino",
  description: "Sign in to Cafino to access your coffee dashboard and daily intake history.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
