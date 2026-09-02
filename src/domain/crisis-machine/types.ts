export const CRISIS_STATES = [
  "IDLE", "SESSION_CREATED", "CRISIS_CONFIRMATION", "DANGER_TRIAGE",
  "EMERGENCY_ESCALATED", "EMERGENCY_WAITING_CONFIRMATION", "MEDICAL_FILTER",
  "AGE_CONTEXT", "ENVIRONMENT_CONTEXT", "DRIVING_CHECK", "OBSERVABLE_BEHAVIOR",
  "PRECEDING_EVENT", "KNOWN_SUPPORT", "INTERVENTION_ENVIRONMENT",
  "INTERVENTION_DEMANDS", "INTERVENTION_REGULATION", "REASSESSMENT",
  "CAREGIVER_CHECK", "CAREGIVER_ESCALATION", "STABILITY_CHECK", "STABLE",
  "PAUSED", "REENTRY_SAFETY_CHECK", "POSTCRISIS_INJURY_CHECK",
  "POSTCRISIS_RECOVERY", "POSTCRISIS_TIMELINE", "POSTCRISIS_ICEBERG",
  "POSTCRISIS_FACTORS", "POSTCRISIS_PREVENTION", "POSTCRISIS_KIT",
  "POSTCRISIS_REPORT_OFFER", "REPORT_CONTEXT", "REPORT_DRAFT", "CLOSED",
  "ABUSE_IMMEDIATE", "ABUSE_NON_IMMEDIATE", "SYSTEM_FALLBACK", "OFFLINE_SAFETY"
] as const;

export type CrisisState = (typeof CRISIS_STATES)[number];
export type RiskLevel = "CRITICAL" | "URGENT" | "ELEVATED" | "MANAGEABLE" | "STABLE";
export type ExpectedAnswer = "yes_no_unknown" | "yes_no" | "ready" | "trend" | "age_band" | "environment" | "scale" | "free_short" | "continue_pause" | "report_type" | "none";
export type NormalizedAnswer = "yes" | "no" | "unknown" | "ready" | "better" | "same" | "worse" | "cannot" | "pause" | "continue" | "called" | "crisis_sheet" | "soap" | "other";

export interface CrisisContext {
  ageBand?: "2-4" | "5-8" | "9-12" | "13-17";
  environment?: "home" | "public" | "car";
  driving?: boolean;
  behavior?: string;
  precedingEvent?: string;
  knownSupport?: string;
  interventionStep?: number;
  lastInterventionId?: string;
  caregiverLoad?: number;
  pausedFrom?: CrisisState;
  postcrisis?: Record<string, string>;
}

export interface SafetyResult {
  level: RiskLevel;
  flags: string[];
  uncertain: boolean;
  evidenceCategories: string[];
}

export interface TurnInput {
  state: CrisisState;
  answer?: string;
  text?: string;
  context?: CrisisContext;
  transcriptUncertain?: boolean;
  recommendedInterventionId?: string | null;
}

export interface TurnOutput {
  state: CrisisState;
  context: CrisisContext;
  risk: SafetyResult;
  writtenText: string;
  audioText: string | null;
  speak: boolean;
  expected: ExpectedAnswer;
  options: string[];
  showEmergencyCall: boolean;
  allowPause: boolean;
  interventionId?: string;
}
