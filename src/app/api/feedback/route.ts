import { NextResponse } from "next/server";

const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL ?? "gayle@zentariph.com";
const FEEDBACK_FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL ?? "Cafino Feedback <onboarding@resend.dev>";

interface FeedbackBody {
  message?: string;
  app?: string;
  sentAt?: string;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Feedback service is not configured. Add RESEND_API_KEY in web-online/.env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Feedback message is required." }, { status: 400 });
  }

  if (message.length > 3000) {
    return NextResponse.json({ error: "Feedback is too long." }, { status: 400 });
  }

  const meta = [
    `App: ${body.app ?? "cafino-online"}`,
    `Sent At: ${body.sentAt ?? new Date().toISOString()}`,
    "",
    message,
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: FEEDBACK_FROM_EMAIL,
      to: [FEEDBACK_TO_EMAIL],
      subject: "Cafino Feedback",
      text: meta,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    const messageText =
      payload?.message ?? payload?.error ?? "Failed to deliver feedback.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
