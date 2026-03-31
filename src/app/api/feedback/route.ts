import { NextResponse } from "next/server";

const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL?.trim();
const FEEDBACK_FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL?.trim();

interface FeedbackBody {
  message?: string;
  app?: string;
  sentAt?: string;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const missingConfig: string[] = [];

  if (!resendApiKey) missingConfig.push("RESEND_API_KEY");
  if (!FEEDBACK_TO_EMAIL) missingConfig.push("FEEDBACK_TO_EMAIL");
  if (!FEEDBACK_FROM_EMAIL) missingConfig.push("FEEDBACK_FROM_EMAIL");

  if (missingConfig.length > 0) {
    return NextResponse.json(
      {
        error: `Feedback service is not configured. Missing: ${missingConfig.join(", ")}.`,
      },
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

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
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
    });
  } catch {
    const messageText =
      controller.signal.aborted
        ? "Feedback provider timed out. Please try again."
        : "Feedback provider is unreachable. Please try again.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    const messageText =
      payload?.message ?? payload?.error ?? "Failed to deliver feedback.";
    const statusCode = response.status >= 400 && response.status <= 599 ? response.status : 502;
    return NextResponse.json({ error: messageText }, { status: statusCode });
  }

  return NextResponse.json({ success: true });
}
