import { beforeAll, describe, expect, it } from "vitest";
import { decryptField, encryptField, secureHash } from "@/infrastructure/crypto/fields";
describe("cifrado de campos", () => {
  beforeAll(() => { process.env.FIELD_ENCRYPTION_KEY_CURRENT = "test-key-with-at-least-thirty-two-characters"; process.env.AUTH_SECRET = "test-auth-secret-with-at-least-thirty-two-characters"; });
  it("cifra con nonce aleatorio y descifra", () => { const a = encryptField("dato sensible"); const b = encryptField("dato sensible"); expect(a).not.toBe(b); expect(decryptField(a)).toBe("dato sensible"); });
  it("produce hashes estables no reversibles", () => { expect(secureHash("abc")).toBe(secureHash("abc")); expect(secureHash("abc")).not.toContain("abc"); });
});
