import { z } from "zod";

export const aiTurnSchema = z.object({
  intent: z.enum(["crisis_active", "postcrisis", "general", "uncertain"]),
  risk_flags: z.array(z.string()).max(20), risk_uncertain: z.boolean(),
  observations: z.object({ age_band: z.enum(["2-4", "5-8", "9-12", "13-17"]).nullable(), environment: z.enum(["home", "public", "car"]).nullable(), driving: z.boolean().nullable(), behavior: z.string().max(500).nullable(), preceding_event: z.string().max(500).nullable(), known_support: z.string().max(300).nullable() }),
  user_command: z.enum(["repeat", "slower", "text_only", "voice_only", "stop", "cannot", "none"]),
  expected_answer: z.enum(["yes_no_unknown", "ready", "trend", "age_band", "environment", "free_short", "none"]),
  recommended_intervention_id: z.string().nullable(), draft_audio_text: z.string().max(500), draft_written_text: z.string().max(1000), requires_static_template: z.boolean()
});
export type AITurn = z.infer<typeof aiTurnSchema>;
export interface AIProvider { name: string; model: string; complete(system: string, input: string): Promise<AITurn> }

const EMPTY: AITurn = { intent: "uncertain", risk_flags: [], risk_uncertain: true, observations: { age_band: null, environment: null, driving: null, behavior: null, preceding_event: null, known_support: null }, user_command: "none", expected_answer: "none", recommended_intervention_id: null, draft_audio_text: "", draft_written_text: "", requires_static_template: true };

class DeterministicProvider implements AIProvider { name = "deterministic"; model = "local-rules"; async complete() { return EMPTY; } }
class OpenAIProvider implements AIProvider {
  name = "openai"; constructor(readonly model: string, private key: string) {}
  async complete(system: string, input: string) { const response = await timedFetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: input }] }) }); const data = await response.json() as { choices?: { message?: { content?: string } }[] }; return aiTurnSchema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? "{}")); }
}
class GeminiProvider implements AIProvider {
  name = "gemini"; constructor(readonly model: string, private key: string) {}
  async complete(system: string, input: string) { const response = await timedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: input }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }) }); const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }; return aiTurnSchema.parse(JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}")); }
}
class AnthropicProvider implements AIProvider {
  name = "anthropic"; constructor(readonly model: string, private key: string) {}
  async complete(system: string, input: string) { const response = await timedFetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": this.key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, max_tokens: 800, temperature: 0, system, messages: [{ role: "user", content: input }] }) }); const data = await response.json() as { content?: { type: string; text?: string }[] }; return aiTurnSchema.parse(JSON.parse(data.content?.find((x) => x.type === "text")?.text ?? "{}")); }
}
async function timedFetch(url: string, init: RequestInit) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 6_000); try { const response = await fetch(url, { ...init, signal: controller.signal }); if (!response.ok) throw new Error("AI_PROVIDER_ERROR"); return response; } finally { clearTimeout(timeout); } }
export function createAIProvider(name = process.env.AI_PRIMARY_PROVIDER ?? "gemini", key = process.env.AI_PRIMARY_API_KEY ?? ""): AIProvider { if (name === "openai" && key) return new OpenAIProvider(process.env.AI_PRIMARY_MODEL ?? "gpt-5-mini", key); if (name === "gemini" && key) return new GeminiProvider(process.env.AI_PRIMARY_MODEL ?? "gemini-3.1-flash-lite", key); if (name === "anthropic" && key) return new AnthropicProvider(process.env.AI_PRIMARY_MODEL ?? "claude-sonnet-4-5", key); return new DeterministicProvider(); }
