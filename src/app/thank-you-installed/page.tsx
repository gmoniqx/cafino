import Link from "next/link";

export default function ThankYouInstalledPage() {
  return (
    <main className="min-h-screen bg-[#f6efe2] px-6 py-12 text-[#2a231b]">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center rounded-[28px] border border-[#dbcbb2] bg-white px-6 py-10 text-center shadow-[0_16px_42px_rgba(53,38,20,0.12)] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f7648]">Cafino</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Thank You for Installing</h1>
        <p className="mt-4 max-w-md text-base text-[#5d5142] sm:text-lg">
          Your install request was received. Open Cafino from your home screen to start using the app.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-2xl border border-[#c7b291] px-5 py-3 text-sm font-semibold text-[#5f4f36] hover:bg-[#faf5ec]"
          >
            Back to Website
          </Link>
          <a
            href="/"
            className="rounded-2xl bg-[#8f7648] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7f6a40]"
          >
            Open Cafino
          </a>
        </div>
      </div>
    </main>
  );
}
