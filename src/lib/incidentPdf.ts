// Generate a case-file PDF timeline for a closed incident, then hand the
// Blob back so the caller can seal it to the Evidence Vault.
import jsPDF from "jspdf";
import type { Incident } from "./incidentStore";

const RED  = [255, 51, 51]  as const;
const CYAN = [0, 200, 220]  as const;
const MUT  = [140, 148, 165] as const;

const fmt = (ts: number) => new Date(ts).toISOString().replace("T", " ").slice(0, 19) + " UTC";

export const generateIncidentPdf = (inc: Incident): { blob: Blob; filename: string; sizeKb: number } => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header band
  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("REDRAINBOW · INCIDENT CASE FILE", 40, 32);
  doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]);
  doc.setFont("courier", "normal"); doc.setFontSize(9);
  doc.text(`${inc.id} · sealed ${fmt(Date.now())}`, 40, 52);

  y = 100;
  doc.setTextColor(230); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(inc.title, 40, y); y += 22;

  doc.setFont("courier", "normal"); doc.setFontSize(9);
  doc.setTextColor(MUT[0], MUT[1], MUT[2]);
  const meta = [
    `Severity  : ${inc.severity}`,
    `Status    : ${inc.status}`,
    `Owner     : ${inc.owner}`,
    `Source    : ${inc.source}`,
    `Opened    : ${fmt(inc.createdAt)}`,
    `Closed    : ${fmt(inc.updatedAt)}`,
    `Duration  : ${Math.max(1, Math.round((inc.updatedAt - inc.createdAt) / 60000))} min`,
    `Signals   : ${inc.linkedSignals.join(", ") || "none"}`,
    `IOCs      : ${inc.linkedIocs.join(", ") || "none"}`,
  ];
  meta.forEach((line) => { doc.text(line, 40, y); y += 14; });

  y += 8;
  doc.setDrawColor(RED[0], RED[1], RED[2]);
  doc.setLineWidth(0.5); doc.line(40, y, W - 40, y); y += 20;

  // Timeline
  doc.setTextColor(RED[0], RED[1], RED[2]); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("TIMELINE", 40, y); y += 16;

  const events: { at: number; label: string }[] = [
    { at: inc.createdAt, label: `Incident opened — ${inc.source}` },
    ...inc.notes.map((n, i) => ({ at: inc.createdAt + (i + 1) * 60_000, label: n })),
    { at: inc.updatedAt, label: `Status set to ${inc.status}` },
  ].sort((a, b) => a.at - b.at);

  doc.setFont("courier", "normal"); doc.setFontSize(9); doc.setTextColor(220);
  events.forEach((e) => {
    if (y > 780) { doc.addPage(); y = 40; }
    doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]); doc.text(fmt(e.at), 40, y);
    doc.setTextColor(220);
    const wrapped = doc.splitTextToSize(e.label, W - 240) as string[];
    wrapped.forEach((line, idx) => { doc.text(line, 200, y + idx * 12); });
    y += Math.max(14, wrapped.length * 12 + 4);
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("courier", "normal"); doc.setFontSize(8);
    doc.setTextColor(MUT[0], MUT[1], MUT[2]);
    doc.text(`RedRainbow Command Layer · ${inc.id} · page ${p}/${pageCount}`, 40, 820);
  }

  const blob = doc.output("blob");
  return {
    blob,
    filename: `${inc.id}_case_file.pdf`,
    sizeKb: Math.max(1, Math.round(blob.size / 1024)),
  };
};

export const downloadIncidentPdf = (inc: Incident) => {
  const { blob, filename } = generateIncidentPdf(inc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};
