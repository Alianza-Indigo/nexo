"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, RotateCcw, Send, Volume2, VolumeX } from "lucide-react";
import { upload } from "@vercel/blob/client";

type Turn = {
  sessionId: string; state: string; risk: { level: string; flags: string[]; uncertain: boolean };
  output: { audioText: string | null; writtenText: string; speak: boolean };
  input: { expected: string; options: string[]; voiceAllowed: boolean; textAllowed: boolean };
  actions: { showEmergencyCall: boolean; allowPause: boolean };
  version: { session: number; protocol: string };
};

export function CrisisClient() {
  const [turn, setTurn] = useState<Turn | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(true);
  const [online, setOnline] = useState(true);
  const [audioMode, setAudioMode] = useState(true);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Preparando apoyo seguro…");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    fetch("/api/v1/crisis/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json()).then((r) => { if (!r.ok) throw new Error(); setTurn(r.data); setStatus(""); })
      .catch(() => setStatus("No fue posible conectar. Usa la guía sin conexión o llama al 911 si hay peligro."))
      .finally(() => setBusy(false));
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);

  const speak = useCallback((message: string | null) => {
    if (!audioMode || !message || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.replace(/911/g, "nueve uno uno"));
    utterance.lang = "es-MX"; utterance.rate = .9; speechSynthesis.speak(utterance);
  }, [audioMode]);

  useEffect(() => { if (turn?.output.speak) speak(turn.output.audioText); }, [turn, speak]);

  async function send(value: string, modality = "text", uncertain = false) {
    if (!turn || busy || !value.trim()) return;
    setBusy(true); setStatus("Procesando de forma segura…");
    try {
      const response = await fetch(`/api/v1/crisis/sessions/${turn.sessionId}/input`, {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ input: value, modality, sessionVersion: turn.version.session, transcriptUncertain: uncertain })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      setTurn(result.data); setText(""); setStatus("");
    } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo procesar. Intenta de nuevo."); }
    finally { setBusy(false); }
  }

  async function toggleRecording() {
    if (recording) { recorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        setRecording(false); stream.getTracks().forEach((track) => track.stop()); setBusy(true); setStatus("Transcribiendo la nota de voz…");
        try {
          const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
          if (blob.size > 8_000_000) throw new Error("La nota de voz es demasiado grande.");
          const uploaded = await upload(`crisis/${turn?.sessionId}/${crypto.randomUUID()}.webm`, blob, { access: "private", handleUploadUrl: "/api/v1/audio/upload-token", clientPayload: JSON.stringify({ sessionId: turn?.sessionId }) });
          const result = await fetch("/api/v1/audio/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: turn?.sessionId, pathname: uploaded.pathname, mimeType: blob.type, size: blob.size }) });
          const parsed = await result.json();
          if (!parsed.ok) throw new Error(parsed.error?.message);
          await send(parsed.data.transcript, "voice", parsed.data.uncertain);
        } catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo procesar el audio. Puedes escribir."); setBusy(false); }
      };
      recorder.current = mediaRecorder; mediaRecorder.start(); setRecording(true); setStatus("Escuchando. Pulsa de nuevo para enviar.");
      setTimeout(() => { if (mediaRecorder.state === "recording") mediaRecorder.stop(); }, 45_000);
    } catch { setStatus("No se pudo usar el micrófono. Puedes continuar escribiendo."); }
  }

  if (!online) return <OfflinePanel />;
  return (
    <div className={`crisis-shell ${busy ? "loading" : ""}`} aria-busy={busy}>
      <div className="crisis-top">
        <span className="connection"><i className="connection-dot" /> En línea</span>
        <a className="emergency-link" href="tel:911">Llamar al 911</a>
      </div>
      <section className="crisis-card" aria-labelledby="mensaje-crisis">
        <div>
          <div className="crisis-state">{turn?.risk.level === "CRITICAL" ? "Peligro inmediato" : "Apoyo paso a paso"}</div>
          <h1 id="mensaje-crisis" className="crisis-message" aria-live="polite">{turn?.output.writtenText ?? "Estoy contigo. Preparando el primer paso…"}</h1>
          {turn?.actions.showEmergencyCall && <div className="notice danger-notice">NEXO no realiza la llamada. En peligro inmediato, llama tú al 911.</div>}
        </div>
        <div>
          {!!turn?.input.options.length && <div className="answer-grid">{turn.input.options.map((option) => <button className="answer" key={option} onClick={() => send(option, "button")}>{option}</button>)}</div>}
          {turn?.input.textAllowed && <form className="crisis-compose" onSubmit={(e) => { e.preventDefault(); send(text); }}><label className="screen-reader" htmlFor="crisis-text">Respuesta breve</label><input id="crisis-text" className="crisis-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} placeholder="También puedes escribir aquí" autoComplete="off" /><button className="icon-button" type="submit" aria-label="Enviar respuesta"><Send size={21} /></button></form>}
          <div className="crisis-controls">
            <button className={`plain-button ${recording ? "recording" : ""}`} type="button" onClick={toggleRecording}><Mic size={18} /> {recording ? "Enviar audio" : "Mantener para hablar"}</button>
            <button className="plain-button" type="button" onClick={() => { setAudioMode(!audioMode); speechSynthesis?.cancel(); }}>{audioMode ? <Volume2 size={18} /> : <VolumeX size={18} />} {audioMode ? "Solo texto" : "Activar voz"}</button>
            {turn?.actions.allowPause && <button className="plain-button" type="button" onClick={() => send("Pausar", "button")}><Pause size={18} /> Pausar</button>}
          </div>
          <div className="status-line" role="status">{status}</div>
        </div>
      </section>
    </div>
  );
}

function OfflinePanel() {
  return <div className="crisis-shell"><section className="crisis-card"><div><div className="crisis-state">Modo sin conexión</div><h1 className="crisis-message">Sin conexión. NEXO no puede analizar lo que ocurre. Si hay peligro inmediato, llama al 911.</h1><div className="notice">Si puedes hacerlo sin forcejear, aleja objetos peligrosos, reduce el ruido y mantén una distancia segura.</div></div><div className="actions"><a className="button button-danger" href="tel:911">Llamar al 911</a><a className="button button-secondary" href="tel:8009112000">Línea de la Vida</a><button className="button button-secondary" onClick={() => location.reload()}><RotateCcw size={18} /> Reintentar conexión</button></div></section></div>;
}
