/**
 * Utilitários para criação de eventos de calendário (.ics e Google Calendar)
 */

interface CalendarEventParams {
  title: string;
  description: string;
  location: string;
  startDateISO: string; // Data ISO com fuso horário explícito
  durationHours?: number;
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, "");
}

export function generateGoogleCalendarUrl({
  title,
  description,
  location,
  startDateISO,
  durationHours = 6,
}: CalendarEventParams): string {
  const start = new Date(startDateISO);
  if (!Number.isFinite(start.getTime())) return "";
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsFileContent({
  title,
  description,
  location,
  startDateISO,
  durationHours = 6,
}: CalendarEventParams): string {
  const start = new Date(startDateISO);
  if (!Number.isFinite(start.getTime())) return "";
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const startFormatted = formatGoogleDate(start);
  const endFormatted = formatGoogleDate(end);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casamento//Site de Casamento//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(params: CalendarEventParams, filename = "casamento.ics") {
  const icsContent = generateIcsFileContent(params);
  if (!icsContent) return;
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
