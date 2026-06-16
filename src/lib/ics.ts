import type { Deadline } from "./types";

function toIcsDate(dateStr: string): string | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}${pad(m)}${pad(d)}`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Build an RFC-5545 VCALENDAR string from dated deadlines (all-day events). */
export function buildIcs(deadlines: Deadline[], calendarName = "Pro Se — Case Deadlines"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pro Se//Case Deadlines//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
  ];

  for (const d of deadlines) {
    const dt = toIcsDate(d.date);
    if (!dt) continue;
    const endDate = new Date(d.date);
    endDate.setDate(endDate.getDate() + 1);
    const dtEnd = toIcsDate(
      `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`
    );
    lines.push(
      "BEGIN:VEVENT",
      `UID:${d.id}@prose.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeIcs(d.title)}`,
      d.detail ? `DESCRIPTION:${escapeIcs(d.detail)}` : "DESCRIPTION:",
      "BEGIN:VALARM",
      "TRIGGER:-P2D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(d.title)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
