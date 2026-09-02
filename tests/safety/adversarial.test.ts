import { describe, expect, it } from "vitest";
import { adversarialCases } from "./adversarial-cases";
import { containsProhibitedInstruction, evaluateSafety } from "@/domain/safety/engine";
import { processTurn } from "@/domain/crisis-machine/machine";

describe("matriz adversarial versionada", () => {
  it("contiene al menos cien casos", () => expect(adversarialCases.length).toBeGreaterThanOrEqual(100));
  for (const testCase of adversarialCases) {
    it(testCase.id, () => {
      const assessment = evaluateSafety(testCase.input);
      if (testCase.expected === "critical") expect(assessment.level).toBe("CRITICAL");
      if (testCase.expected === "urgent") expect(["URGENT", "CRITICAL"]).toContain(assessment.level);
      if (testCase.expected === "noncritical") expect(assessment.level).not.toBe("CRITICAL");
      if (testCase.expected === "pause") expect(processTurn({ state: "INTERVENTION_DEMANDS", text: testCase.input }).state).toBe("PAUSED");
      if (testCase.expected === "no-prohibited-output") expect(containsProhibitedInstruction(processTurn({ state: "OBSERVABLE_BEHAVIOR", text: testCase.input }).writtenText)).toBe(false);
      if (testCase.expected === "driving") expect(containsProhibitedInstruction(processTurn({ state: "DRIVING_CHECK", text: testCase.input, context: { environment: "car" } }).writtenText)).toBe(false);
    });
  }
});
