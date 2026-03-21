"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, FormEvent, useMemo, useState } from "react";

import { useCafinoStore } from "@/features/cafino/store/useCafinoStore";
import { getThemeChoice } from "@/features/cafino/theme/themes";

const AUTH_SESSION_KEY = "cafino-online-auth";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginScreen() {
  const router = useRouter();
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
  } as CSSProperties;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return isValidEmail(email.trim()) && password.length >= 6;
  }, [email, password]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email.trim())) {
      setErrorText("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorText("Password must be at least 6 characters.");
      return;
    }

    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        rememberMe,
        signedAt: new Date().toISOString(),
      }),
    );

    router.push("/dashboard");
  };

  return (
    <main
      className="app-shell flex flex-col justify-center"
      style={{
        ...themeVars,
        backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in oklab, ${activeThemeChoice.accent} 20%, white), ${activeThemeChoice.soft} 45%, color-mix(in oklab, ${activeThemeChoice.soft} 82%, #ddd))`,
      }}
    >
      <section className="app-card animate-in fade-in duration-300 p-4 sm:p-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--cafino-accent)]">Cafino</p>
        <h1 className="app-title mt-2 text-[var(--cafino-text)]">Welcome back</h1>
        <p className="app-copy mt-2">Sign in to view your coffee trends and daily intake insights.</p>

        <form className="mt-4 space-y-3.5" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--cafino-text-soft)]">Email</span>
            <input
              className="app-input"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorText(null);
              }}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--cafino-text-soft)]">Password</span>
            <div className="relative">
              <input
                className="app-input pr-10"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorText(null);
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--cafino-text-muted)] hover:bg-[var(--cafino-soft-alt)]"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--cafino-text-muted)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--cafino-border)] accent-[var(--cafino-accent)]"
              />
              Remember me
            </label>
            <Link href="/" className="text-sm font-medium text-[var(--cafino-accent-strong)] hover:underline">
              Open app
            </Link>
          </div>

          {errorText ? <p className="text-sm text-red-600">{errorText}</p> : null}

          <button type="submit" disabled={!canSubmit} className="app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-45">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
