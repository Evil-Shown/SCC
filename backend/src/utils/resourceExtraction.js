import fs from "fs/promises";

import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";

import { ResourceTypes } from "../models/Resource.js";
import { createChatCompletion, getChatCompletionText, getDefaultChatModel } from "../config/openai.js";

function normalizeLine(s) {
  return String(s || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function guessTypeFromName(name) {
  const n = String(name || "").toLowerCase();
  if (/(lab|laboratory)\b/.test(n)) return ResourceTypes.LAB;
  if (/\b(lh|lecture\s*hall|hall)\b/.test(n)) return ResourceTypes.LECTURE_HALL;
  if (/^lh[\s_-]*[a-z0-9]/i.test(name)) return ResourceTypes.LECTURE_HALL;
  if (/^lab[\s_-]*[a-z0-9]/i.test(name)) return ResourceTypes.LAB;
  return null;
}

function normalizeResourceName(name) {
  return normalizeLine(name)
    .replace(/\s+/g, " ")
    .replace(/[|]+/g, "")
    .trim();
}

function isHeaderLikeRow(name, location = "") {
  const n = String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
  const l = String(location || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return true;

  // Treat "labs"/"lecture halls" as header only when the name is exactly that title.
  const exactHeaderNames = new Set([
    "name",
    "type",
    "location",
    "capacity",
    "resource",
    "resources",
    "room",
    "rooms",
    "lecture hall",
    "lecture halls",
    "lab",
    "labs",
    "header",
    "title",
    "no",
    "no.",
    "#"
  ]);
  if (exactHeaderNames.has(n)) return true;

  // Classic table heading row patterns.
  const headingLinePatterns = [
    /\b(room|resource)\s*(name|type|location|capacity)\b/,
    /\b(name|type|location|capacity)\b.*\b(name|type|location|capacity)\b/
  ];
  if (headingLinePatterns.some((re) => re.test(n))) return true;
  if (l && headingLinePatterns.some((re) => re.test(l))) return true;

  // Footer/meta rows that are not resources.
  const metaPatterns = [
    /\b(timetable|schedule|semester|department|faculty|university)\b/,
    /\b(page\s*\d+|generated|updated|date)\b/
  ];
  if (metaPatterns.some((re) => re.test(n)) && !guessTypeFromName(n)) return true;
  if (l && metaPatterns.some((re) => re.test(l)) && !guessTypeFromName(n)) return true;

  return false;
}

function parseJsonArrayFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];

  // direct JSON
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // continue
  }

  // fenced markdown JSON
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      const parsed = JSON.parse(fence[1].trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // continue
    }
  }

  // best-effort array slice
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function extractCandidatesWithAI(text) {
  if (!process.env.OPENAI_API_KEY) return [];
  const cleaned = String(text || "").trim();
  if (!cleaned) return [];

  const capped = cleaned.slice(0, 24000);
  const systemPrompt =
    "You extract university room resources from OCR/PDF text. " +
    "Return ONLY a JSON array. Each item must be: " +
    "{ \"name\": string, \"resourceType\": \"LECTURE_HALL\"|\"LAB\", \"location\": string }. " +
    "Rules: " +
    "1) Keep names exactly as they appear where possible (e.g. LH-A1, Lab 3). " +
    "2) Ignore unrelated rows/headings/times. " +
    "3) If location is missing, set location to empty string. " +
    "4) Do not invent resources. " +
    "5) Deduplicate by (resourceType, name). " +
    "6) Never include headers or column names (e.g. Name, Type, Location, Lecture Halls, Labs). " +
    "7) Include an item only when the room name is explicitly present in text; do not infer missing rooms. " +
    "8) Exclude lines that look like section titles, summaries, or notes.";

  const userPrompt =
    "Extract lecture halls and labs from this text.\n\n" +
    "Text:\n" +
    capped;

  const data = await createChatCompletion({
    model: getDefaultChatModel(),
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const reply = getChatCompletionText(data);
  const parsed = parseJsonArrayFromText(reply);
  return parsed
    .map((r) => ({
      name: normalizeResourceName(r?.name),
      resourceType: r?.resourceType === ResourceTypes.LAB ? ResourceTypes.LAB : (
        r?.resourceType === ResourceTypes.LECTURE_HALL ? ResourceTypes.LECTURE_HALL : guessTypeFromName(r?.name)
      ),
      location: normalizeLine(r?.location || "")
    }))
    .filter((r) =>
      r.name &&
      Object.values(ResourceTypes).includes(r.resourceType) &&
      !isHeaderLikeRow(r.name, r.location)
    );
}

function dedupeResources(resources) {
  const seen = new Set();
  return resources.filter((r) => {
    const key = `${r.resourceType}|${String(r.name).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractCandidatesFromText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const out = [];

  for (const line of lines) {
    // Common patterns:
    // - "LH-A1 - Main Building"
    // - "Lab 2, Computing Center"
    // - "Lecture Hall B3 (Block B)"
    const m = line.match(/^(.{2,80}?)(?:\s*[-,|]\s+|\s*\(([^)]+)\)\s*$)(.{2,120})$/);
    if (m) {
      const name = normalizeLine(m[1]);
      const loc = normalizeLine(m[3] || m[2] || "");
      const cleanName = normalizeResourceName(name);
      const rt = guessTypeFromName(cleanName);
      if (cleanName && rt) out.push({ name: cleanName, resourceType: rt, location: loc });
      continue;
    }

    // Split common table-like lines: "LH-A1    Main Building"
    const parts = line.split(/\s{2,}|\t+/).map(normalizeLine).filter(Boolean);
    if (parts.length >= 2) {
      const name = normalizeResourceName(parts[0]);
      const loc = parts.slice(1).join(" ");
      const rt = guessTypeFromName(name);
      if (name && rt) {
        out.push({ name, resourceType: rt, location: loc });
        continue;
      }
    }

    // If a line itself looks like a resource name, keep with empty location.
    const nameOnly = normalizeResourceName(line);
    const rt = guessTypeFromName(nameOnly);
    if (rt && nameOnly.length <= 40) {
      out.push({ name: nameOnly, resourceType: rt, location: "" });
    }
  }

  // De-dupe by (type,name)
  return dedupeResources(out).filter((r) => !isHeaderLikeRow(r.name, r.location));
}

export async function extractResourcesFromFile({ filePath, mimetype }) {
  const mt = String(mimetype || "").toLowerCase();

  let text = "";
  if (mt === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
    const buf = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buf });
    try {
      const parsed = await parser.getText();
      text = parsed?.text || "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  } else if (mt.startsWith("image/")) {
    const r = await Tesseract.recognize(filePath, "eng");
    text = r?.data?.text || "";
  } else {
    const buf = await fs.readFile(filePath);
    text = buf.toString("utf8");
  }

  const ruleBasedResources = extractCandidatesFromText(text);
  let aiResources = [];
  try {
    aiResources = await extractCandidatesWithAI(text);
  } catch (e) {
    // Fallback silently to rule-based extraction when AI provider fails.
    console.warn("extractCandidatesWithAI fallback:", e?.message || e);
  }

  // Precision-first behavior:
  // - If AI returns results, trust AI only (avoid rule-based over-extraction).
  // - Use rule-based only as fallback when AI is unavailable/empty.
  const primary = Array.isArray(aiResources) && aiResources.length > 0
    ? aiResources
    : ruleBasedResources;
  const resources = dedupeResources(primary).filter((r) => !isHeaderLikeRow(r.name, r.location));
  const textPreview = String(text || "").slice(0, 1200);
  return { resources, textPreview };
}

