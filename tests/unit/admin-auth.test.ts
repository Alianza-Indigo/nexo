import { describe, expect, it } from "vitest";
import { isAdminRole, isSecurityAdminRole } from "@/application/admin/authorize";
import { credentialsMatch } from "@/infrastructure/auth/superadmin";

describe("autorización administrativa", () => {
  it("reconoce al superadministrador en todos los controles administrativos", () => {
    expect(isAdminRole("SUPERADMIN")).toBe(true);
    expect(isSecurityAdminRole("SUPERADMIN")).toBe(true);
  });

  it("no concede privilegios administrativos a una cuenta cuidadora", () => {
    expect(isAdminRole("CAREGIVER")).toBe(false);
    expect(isSecurityAdminRole("CAREGIVER")).toBe(false);
  });

  it("valida correo normalizado y contraseña exacta contra el entorno", () => {
    expect(credentialsMatch(" Admin@Example.com ", "a-strong-password", "admin@example.com", "a-strong-password")).toBe(true);
    expect(credentialsMatch("admin@example.com", "wrong-password", "admin@example.com", "a-strong-password")).toBe(false);
  });
});
