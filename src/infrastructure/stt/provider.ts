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

export function getSTTProvider(): STTProvider {
  if (process.env.STT_PROVIDER === "openai" && process.env.STT_API_KEY) return new OpenAIStt(process.env.STT_API_KEY);
  return new DisabledSTT();
}
