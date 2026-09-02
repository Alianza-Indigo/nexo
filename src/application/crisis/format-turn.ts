import type { TurnOutput } from "@/domain/crisis-machine/types";

export function formatTurn(sessionId: string, sessionVersion: number, turn: TurnOutput) {
  return {
    sessionId,
    state: turn.state,
    risk: turn.risk,
    output: { audioText: turn.audioText, writtenText: turn.writtenText, speak: turn.speak },
    input: { expected: turn.expected, options: turn.options, voiceAllowed: true, textAllowed: turn.expected !== "none" },
    actions: { showEmergencyCall: turn.showEmergencyCall, allowPause: turn.allowPause },
    interventionId: turn.interventionId ?? null,
    version: { session: sessionVersion, protocol: process.env.PROTOCOL_VERSION ?? "2.0" }
  };
}
