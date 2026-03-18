import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { provider, apiKey, model, systemPrompt, userPrompt } =
    await req.json();

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Go to Settings to add one." },
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
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        // Sanitize: never echo back anything that might contain the key
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
          messages: [{ role: "user", content: userPrompt }],
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
    // Never include raw error details that might leak the key
    const message =
      e instanceof Error ? e.message : "An unexpected error occurred";
    const safeMessage = message.replace(/sk-[a-zA-Z0-9_-]+/g, "sk-***");
    return NextResponse.json(
      { error: `Request failed: ${safeMessage}` },
      { status: 500 }
    );
  }
}
