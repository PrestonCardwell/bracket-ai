import { NextRequest, NextResponse } from "next/server";

// Server-side API key from environment (Vercel). Never sent to the browser.
const SERVER_OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const SERVER_PROVIDER = "openai";
const SERVER_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { systemPrompt } = body;

  // Support both single-prompt (legacy) and multi-turn messages
  const messages: { role: string; content: string }[] = body.messages
    ? body.messages
    : [{ role: "user", content: body.userPrompt }];

  // Use server key if available, fall back to client-provided key
  const apiKey = SERVER_OPENAI_KEY || body.apiKey;
  const provider = SERVER_OPENAI_KEY ? SERVER_PROVIDER : body.provider;
  const model = SERVER_OPENAI_KEY ? SERVER_MODEL : body.model;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured. Please try again later." },
      { status: 400 }
    );
  }

  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_completion_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        // Never leak API keys in error messages
        const safeErr = err.replace(/sk-[a-zA-Z0-9_-]+/g, "sk-***");
        return NextResponse.json(
          { error: `OpenAI API error (${res.status}): ${safeErr}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        content: data.choices[0].message.content,
      });
    }

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        const safeErr = err.replace(/sk-ant-[a-zA-Z0-9_-]+/g, "sk-ant-***");
        return NextResponse.json(
          { error: `Anthropic API error (${res.status}): ${safeErr}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        content: data.content[0].text,
      });
    }

    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unexpected error occurred";
    const safeMessage = message.replace(/sk-[a-zA-Z0-9_-]+/g, "sk-***");
    return NextResponse.json(
      { error: `Request failed: ${safeMessage}` },
      { status: 500 }
    );
  }
}
