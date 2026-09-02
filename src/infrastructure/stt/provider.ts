export interface TranscriptResult { text: string; confidence?: number; uncertain: boolean }
export interface STTProvider { transcribe(audio: Uint8Array, mimeType: string): Promise<TranscriptResult> }

class DisabledSTT implements STTProvider {
  async transcribe(): Promise<TranscriptResult> { throw new Error("STT_DISABLED"); }
}

class OpenAIStt implements STTProvider {
  constructor(private readonly apiKey: string, private readonly model = "gpt-4o-mini-transcribe") {}
  async transcribe(audio: Uint8Array, mimeType: string): Promise<TranscriptResult> {
    const form = new FormData();
    form.append("file", new Blob([audio as BlobPart], { type: mimeType }), mimeType.includes("mp4") ? "audio.m4a" : "audio.webm");
    form.append("model", this.model); form.append("language", "es"); form.append("response_format", "json");
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}` }, body: form, signal: controller.signal });
      if (!response.ok) throw new Error("STT_PROVIDER_ERROR");
      const data = await response.json() as { text?: string };
      const text = data.text?.trim() ?? "";
      return { text, uncertain: text.length === 0 };
    } finally { clearTimeout(timeout); }
  }
}

class GeminiStt implements STTProvider {
  constructor(private readonly apiKey: string, private readonly model = "gemini-3.1-flash-lite") {}
  async transcribe(audio: Uint8Array, mimeType: string): Promise<TranscriptResult> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: "Transcribe literalmente esta nota de voz en español. No completes silencios, no interpretes emociones y devuelve únicamente la transcripción." },
            { inlineData: { mimeType, data: Buffer.from(audio).toString("base64") } }
          ] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1200 }
        })
      });
      if (!response.ok) throw new Error("STT_PROVIDER_ERROR");
      const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      return { text, uncertain: text.length === 0 };
    } finally { clearTimeout(timeout); }
  }
}

export function getSTTProvider(): STTProvider {
  if (process.env.STT_PROVIDER === "openai" && process.env.STT_API_KEY) return new OpenAIStt(process.env.STT_API_KEY);
  if (process.env.STT_PROVIDER === "gemini") {
    const key = process.env.STT_API_KEY ?? process.env.AI_PRIMARY_API_KEY;
    if (key) return new GeminiStt(key, process.env.AI_PRIMARY_MODEL ?? "gemini-3.1-flash-lite");
  }
  return new DisabledSTT();
}
