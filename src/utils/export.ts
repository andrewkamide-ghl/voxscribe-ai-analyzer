import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

// Helpers
function safeStamp(iso: string) {
  try {
    return iso.replace(/[:.]/g, "-");
  } catch {
    return String(Date.now());
  }
}

function slugify(s: string) {
  return (s || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function saveTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename);
}

function saveDocFile(filename: string, title: string, content: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.4; }
    h1 { font-size: 20px; margin-bottom: 10px; }
    pre { white-space: pre-wrap; font-family: inherit; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  saveAs(blob, filename);
}

function savePdfFile(filename: string, title: string, content: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const top = 56;
  const maxWidth = 500; // ~A4 width minus margins

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text(title, left, top);

  doc.setFontSize(12);
  const lines = doc.splitTextToSize(content, maxWidth);

  let y = top + 24;
  const lineHeight = 16;
  lines.forEach((line: string) => {
    if (y > 780) { // add new page if close to bottom
      doc.addPage();
      y = top;
    }
    doc.text(line, left, y);
    y += lineHeight;
  });

  doc.save(filename);
}

// Analysis Run exports
export type AnalysisRunLike = {
  timestamp: string;
  summary: string;
  insights: string[];
  facts: { statement: string; score: number; citations: string[] }[];
  selection: string;
};

export function buildAnalysisText(run: AnalysisRunLike) {
  const parts: string[] = [];
  parts.push("Summary\n\n" + (run.summary || "(none)"));
  parts.push(
    "\n\nInsights\n" + (run.insights?.length ? run.insights.map((i) => `- ${i}`).join("\n") : "(none)")
  );
  const facts = run.facts?.length
    ? run.facts
        .map((f) => `- ${f.statement} [${Math.round(Number(f.score) || 0)}%]${
            f.citations?.length ? `\n  citations: ${f.citations.join(", ")}` : ""
          }`)
        .join("\n")
    : "(none)";
  parts.push("\n\nFact Check\n" + facts);
  parts.push("\n\nSelection\n\n" + (run.selection || "(none)"));
  return parts.join("");
}

export function saveRunAsText(run: AnalysisRunLike) {
  const stamp = safeStamp(run.timestamp || new Date().toISOString());
  const filename = `analysis-${stamp}.txt`;
  const content = buildAnalysisText(run);
  saveTextFile(filename, content);
}

export function saveRunAsDoc(run: AnalysisRunLike) {
  const stamp = safeStamp(run.timestamp || new Date().toISOString());
  const base = `analysis-${stamp}`;
  const title = `Analysis ${stamp}`;
  const content = buildAnalysisText(run);
  saveDocFile(`${base}.doc`, title, content);
}

export function saveRunAsPDF(run: AnalysisRunLike) {
  const stamp = safeStamp(run.timestamp || new Date().toISOString());
  const base = `analysis-${stamp}`;
  const title = `Analysis ${stamp}`;
  const content = buildAnalysisText(run);
  savePdfFile(`${base}.pdf`, title, content);
}

// Research exports
export type ResearchItemLike = {
  id: string;
  topic: string;
  type: string;
  content: string;
  createdAt: string | number;
};

export function buildResearchText(item: ResearchItemLike) {
  const created = new Date(item.createdAt).toLocaleString();
  const header = `${item.topic} — ${item.type}\nCreated: ${created}`;
  return `${header}\n\n${item.content || "(empty)"}`;
}

export function saveResearchAsText(item: ResearchItemLike) {
  const stamp = safeStamp(new Date(item.createdAt).toISOString());
  const filename = `${slugify(item.topic)}-${stamp}.txt`;
  const content = buildResearchText(item);
  saveTextFile(filename, content);
}

export function saveResearchAsDoc(item: ResearchItemLike) {
  const stamp = safeStamp(new Date(item.createdAt).toISOString());
  const base = `${slugify(item.topic)}-${stamp}`;
  const title = `${item.topic} — ${item.type}`;
  const content = buildResearchText(item);
  saveDocFile(`${base}.doc`, title, content);
}

export function saveResearchAsPDF(item: ResearchItemLike) {
  const stamp = safeStamp(new Date(item.createdAt).toISOString());
  const base = `${slugify(item.topic)}-${stamp}`;
  const title = `${item.topic} — ${item.type}`;
  const content = buildResearchText(item);
  savePdfFile(`${base}.pdf`, title, content);
}
