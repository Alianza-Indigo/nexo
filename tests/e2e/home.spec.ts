import { test, expect } from "@playwright/test";
test("la ayuda inmediata está disponible sin registro", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("main").getByRole("link", { name: /Necesito ayuda ahora/ })).toBeVisible(); await expect(page.getByRole("link", { name: /Llamar al 911/ })).toBeVisible(); });
test("el acceso a ayuda permanece visible fuera de la portada", async ({ page }) => { await page.goto("/settings"); await expect(page.getByRole("banner").getByRole("link", { name: /ayuda ahora/i })).toBeVisible(); });
test("el modo offline declara sus límites", async ({ page }) => { await page.goto("/offline"); await expect(page.getByRole("heading", { name: /NEXO no puede analizar/ })).toBeVisible(); });
