import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { decryptField } from "@/infrastructure/crypto/fields";
import { problem, safeError } from "@/lib/api";

type Document = { title: string; disclaimer: string; sections: { heading: string; body: string }[] };
function wrap(text: string, width = 88) { const words = text.split(/\s+/); const lines: string[] = []; let line = ""; for (const word of words) { if (`${line} ${word}`.trim().length > width) { lines.push(line); line = word; } else line = `${line} ${word}`.trim(); } if (line) lines.push(line); return lines; }
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const { id } = await params;
    const report = await db.postcrisisReport.findFirst({ where: { id, ownerUserId: user.id, deletedAt: null } }); if (!report) return problem(404, "NOT_FOUND", "Reporte no encontrado.");
    const doc = JSON.parse(decryptField(report.contentEncrypted)) as Document; const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold); let page = pdf.addPage([612, 792]); let y = 742;
    const write = (text: string, size = 11, strong = false, color = rgb(.09, .19, .18)) => { for (const line of wrap(text, size >= 18 ? 52 : 88)) { if (y < 60) { page = pdf.addPage([612, 792]); y = 742; } page.drawText(line, { x: 55, y, size, font: strong ? bold : font, color }); y -= size * 1.45; } };
    write(doc.title, 21, true); y -= 8; write(doc.disclaimer, 9, false, rgb(.35, .35, .35)); y -= 16;
    for (const section of doc.sections) { write(section.heading, 13, true); y -= 3; write(section.body); y -= 14; }
    y -= 10; write(`Generado por NEXO · Protocolo ${process.env.PROTOCOL_VERSION ?? "2.0"} · ${new Date().toLocaleDateString("es-MX")}`, 8, false, rgb(.4, .4, .4));
    const bytes = await pdf.save(); return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="nexo-${report.reportType.toLowerCase()}-${id.slice(-6)}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return safeError(error); }
}
