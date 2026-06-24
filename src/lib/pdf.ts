import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CaseFile } from "./types";

const PAGE = { w: 612, h: 792 }; // US Letter, points
const MARGIN = 72; // 1 inch
const LINE = 16;

interface Writer {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
}

async function newWriter(): Promise<Writer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const page = doc.addPage([PAGE.w, PAGE.h]);
  return { doc, font, bold, page, y: PAGE.h - MARGIN };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") {
      out.push("");
      continue;
    }
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = trial;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function ensureSpace(w: Writer, needed = LINE) {
  if (w.y - needed < MARGIN) {
    w.page = w.doc.addPage([PAGE.w, PAGE.h]);
    w.y = PAGE.h - MARGIN;
  }
}

function writeParagraph(
  w: Writer,
  text: string,
  opts: { size?: number; bold?: boolean; gap?: number; indent?: number } = {}
) {
  const size = opts.size ?? 12;
  const font = opts.bold ? w.bold : w.font;
  const indent = opts.indent ?? 0;
  const maxWidth = PAGE.w - MARGIN * 2 - indent;
  for (const line of wrapText(text, font, size, maxWidth)) {
    ensureSpace(w, LINE);
    w.page.drawText(line, {
      x: MARGIN + indent,
      y: w.y,
      size,
      font,
      color: rgb(0.08, 0.08, 0.1),
    });
    w.y -= LINE;
  }
  if (opts.gap) w.y -= opts.gap;
}

function hr(w: Writer) {
  ensureSpace(w, LINE);
  w.page.drawLine({
    start: { x: MARGIN, y: w.y },
    end: { x: PAGE.w - MARGIN, y: w.y },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.62),
  });
  w.y -= LINE;
}

function caption(w: Writer, c: CaseFile, docTitle: string) {
  writeParagraph(w, (c.jurisdiction || "[COURT / JURISDICTION]").toUpperCase(), {
    bold: true,
    size: 12,
  });
  w.y -= 4;
  hr(w);
  const plaintiff =
    c.parties.find((p) => /plaintiff|petitioner|state|people|prosecut/i.test(p.role))?.name ||
    (c.role === "plaintiff" || c.role === "petitioner" ? "[You]" : "[Opposing party]");
  const defendant =
    c.parties.find((p) => /defendant|respondent/i.test(p.role))?.name ||
    (c.role === "defendant" || c.role === "respondent" ? "[You]" : "[Opposing party]");
  writeParagraph(w, `${plaintiff || "[Plaintiff]"},`, { size: 12 });
  writeParagraph(w, "Plaintiff/Petitioner,", { indent: 24, size: 11 });
  writeParagraph(w, "v.", { indent: 12, size: 12 });
  writeParagraph(w, `${defendant || "[Defendant]"},`, { size: 12 });
  writeParagraph(w, "Defendant/Respondent.", { indent: 24, size: 11, gap: 6 });
  writeParagraph(w, `Case No.: ${c.caseNumber || "[Case Number]"}`, { size: 12 });
  hr(w);
  w.y -= 6;
  writeParagraph(w, docTitle.toUpperCase(), { bold: true, size: 13, gap: 10 });
}

async function finalize(w: Writer): Promise<Blob> {
  const bytes = await w.doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/** A formatted legal document (motion / declaration / response) with caption. */
export async function buildLegalDocPdf(
  c: CaseFile,
  docTitle: string,
  body: string
): Promise<Blob> {
  const w = await newWriter();
  caption(w, c, docTitle);
  // Strip simple markdown markers so the PDF reads cleanly.
  const clean = body.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");
  for (const para of clean.split(/\n{2,}/)) {
    const heading = /^[-A-Z0-9 .,'"()]{6,}$/.test(para.trim()) && para.trim().length < 70;
    writeParagraph(w, para.trim(), { gap: 8, bold: heading });
  }
  w.y -= 10;
  writeParagraph(w, "Respectfully submitted,", { gap: 24 });
  writeParagraph(w, "_______________________________");
  writeParagraph(w, "[Your name], Self-Represented");
  w.y -= 12;
  writeParagraph(
    w,
    "Draft prepared with Pro Se. Not legal advice. Verify formatting against your court's local rules before filing.",
    { size: 9 }
  );
  return finalize(w);
}

/** A cover page + indexed list of exhibits derived from the case evidence. */
export async function buildExhibitBinderPdf(c: CaseFile): Promise<Blob> {
  const w = await newWriter();
  writeParagraph(w, "EXHIBIT BINDER", { bold: true, size: 16, gap: 6 });
  writeParagraph(w, c.title || "[Case title]", { size: 12 });
  writeParagraph(w, c.jurisdiction || "[Court / Jurisdiction]", { size: 12 });
  writeParagraph(w, `Case No.: ${c.caseNumber || "[Case Number]"}`, { size: 12, gap: 12 });
  hr(w);
  writeParagraph(w, "INDEX OF EXHIBITS", { bold: true, size: 13, gap: 8 });

  if (c.evidence.length === 0) {
    writeParagraph(w, "No evidence has been added to the case file yet.", { size: 12 });
  } else {
    c.evidence.forEach((e, i) => {
      const label = e.exhibitId || String.fromCharCode(65 + (i % 26));
      writeParagraph(w, `Exhibit ${label}: ${e.label || "(untitled)"}`, {
        bold: true,
        size: 12,
      });
      if (e.description) writeParagraph(w, e.description, { indent: 18, size: 11 });
      if (e.supports)
        writeParagraph(w, `Relevance: ${e.supports}`, { indent: 18, size: 11 });
      writeParagraph(w, `Type: ${e.type}`, { indent: 18, size: 10, gap: 8 });
    });
  }

  // One labeled separator page per exhibit.
  c.evidence.forEach((e, i) => {
    const label = e.exhibitId || String.fromCharCode(65 + (i % 26));
    const page = w.doc.addPage([PAGE.w, PAGE.h]);
    const size = 48;
    const text = `EXHIBIT ${label}`;
    const tw = w.bold.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (PAGE.w - tw) / 2,
      y: PAGE.h / 2,
      size,
      font: w.bold,
      color: rgb(0.1, 0.1, 0.12),
    });
    const sub = e.label || "";
    if (sub) {
      const sw = w.font.widthOfTextAtSize(sub, 16);
      page.drawText(sub, {
        x: (PAGE.w - sw) / 2,
        y: PAGE.h / 2 - 40,
        size: 16,
        font: w.font,
        color: rgb(0.3, 0.3, 0.32),
      });
    }
  });

  return finalize(w);
}

export { downloadBlob } from "./download";
