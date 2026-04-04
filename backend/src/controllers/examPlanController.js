import axios from "axios";
import FormData from "form-data";
import { PDFParse } from "pdf-parse";
import Exam from "../models/Exam.js";
import Timetable from "../models/Timetable.js";
import {
  assertOpenAIConfigured,
  createChatCompletion,
  getChatCompletionText,
  getDefaultChatModel
} from "../config/openai.js";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const parseJsonLoose = (value, fallback) => {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    const cleaned = value
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return fallback;
    }
  }
};

const isoDay = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const daysUntil = (dateLike) => {
  const now = Date.now();
  const target = new Date(dateLike).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
};

const normalizeDifficultyFactor = (difficulty) => {
  switch (String(difficulty || "").toLowerCase()) {
    case "easy":
      return 0.85;
    case "hard":
      return 1.25;
    case "medium":
    default:
      return 1;
  }
};

const estimateFreeHoursFromTimetable = async (userId) => {
  const timetable = await Timetable.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!timetable) {
    return 3;
  }

  const events = [...(timetable.universitySchedule || []), ...(timetable.optimizedSchedule || [])];
  if (events.length === 0) {
    return 3;
  }

  const startHour = 6;
  const endHour = 22;
  const maxWindow = endHour - startHour;
  const byDay = new Map();

  for (const evt of events) {
    const start = new Date(evt.start);
    const end = new Date(evt.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) continue;

    const day = isoDay(start);
    if (!day) continue;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const inWindowStart = Math.max(startMinutes, startHour * 60);
    const inWindowEnd = Math.min(endMinutes, endHour * 60);
    const busyMinutes = Math.max(0, inWindowEnd - inWindowStart);

    byDay.set(day, (byDay.get(day) || 0) + busyMinutes);
  }

  if (byDay.size === 0) {
    return 3;
  }

  const freeHours = [...byDay.values()].map((busy) => clamp((maxWindow * 60 - busy) / 60, 0, maxWindow));
  const average = freeHours.reduce((a, b) => a + b, 0) / freeHours.length;
  return Number(average.toFixed(1));
};

const buildRoadmap = ({ examDate, topics, difficulty = "medium", freeHoursPerDay = 3 }) => {
  const safeTopics = Array.isArray(topics) ? topics.filter(Boolean) : [];
  const daysLeft = Math.max(1, daysUntil(examDate));
  const topicCount = Math.max(1, safeTopics.length);
  const baseHours = clamp(Number(freeHoursPerDay) || 3, 1, 12);
  const difficultyFactor = normalizeDifficultyFactor(difficulty);

  const totalRequiredHours = clamp(topicCount * 1.5 * difficultyFactor, 2, 200);
  const planDays = Math.min(daysLeft, 45);
  const suggestedHours = clamp(totalRequiredHours / planDays, 1, baseHours);

  const roadmap = [];
  let topicPointer = 0;
  const today = new Date();

  for (let i = 0; i < planDays; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayTopics = [];
    const targetTopics = i % 5 === 4 ? 1 : 2;
    for (let t = 0; t < targetTopics && safeTopics.length > 0; t += 1) {
      dayTopics.push(safeTopics[topicPointer % safeTopics.length]);
      topicPointer += 1;
    }

    const isRevisionDay = i % 5 === 4;
    roadmap.push({
      date: isoDay(d),
      estimatedHours: Number(suggestedHours.toFixed(1)),
      tasks: isRevisionDay
        ? ["Spaced revision", "Practice key questions", "Flashcard recall"]
        : dayTopics.length > 0
          ? dayTopics.map((topic) => `Study: ${topic}`)
          : ["Review class notes", "Practice recall questions"],
      focus: isRevisionDay ? "revision" : "new-learning"
    });
  }

  return {
    daysLeft,
    suggestedHoursPerDay: Number(suggestedHours.toFixed(1)),
    roadmap
  };
};

const extractNotesText = async (files = []) => {
  const chunks = [];
  for (const file of files) {
    if (!file?.buffer) continue;
    const type = String(file.mimetype || "").toLowerCase();

    if (type.includes("pdf") || file.originalname?.toLowerCase().endsWith(".pdf")) {
      try {
        const parser = new PDFParse({ data: file.buffer });
        try {
          const parsed = await parser.getText();
          chunks.push(parsed?.text || "");
        } finally {
          await parser.destroy().catch(() => {});
        }
      } catch {
        chunks.push("");
      }
      continue;
    }

    if (type.startsWith("text/") || file.originalname?.toLowerCase().endsWith(".md") || file.originalname?.toLowerCase().endsWith(".txt")) {
      chunks.push(file.buffer.toString("utf8"));
    }
  }

  return chunks.join("\n\n").trim();
};

const fallbackAiPayload = ({ subjectName, roadmap }) => ({
  summary: `Focused summary for ${subjectName || "your subject"}: prioritize core definitions, workflows, and high-frequency exam patterns first.`,
  flashcards: [
    { front: "What are the 3 highest-priority concepts?", back: "List the 3 concepts most likely to appear and explain each in 2 sentences." },
    { front: "How should you revise daily?", back: "Use 60% deep study + 30% recall + 10% quick self-test." }
  ],
  keyQuestions: [
    "Which topics are repeatedly tested in past papers?",
    "What are the most error-prone definitions or formulas?",
    "Which concepts can be connected into a single long-answer structure?"
  ],
  smartRevisionPlan: roadmap?.roadmap?.slice(0, 7) || []
});

const recomputeReadiness = (exam) => {
  const topicRatio =
    Number(exam.totalTopics) > 0
      ? clamp(Number(exam.completedTopics) / Number(exam.totalTopics), 0, 1)
      : null;

  const completedPlanDays = Array.isArray(exam.dailyPlan)
    ? exam.dailyPlan.filter((d) => d?.isCompleted).length
    : 0;
  const planRatio =
    Array.isArray(exam.dailyPlan) && exam.dailyPlan.length > 0
      ? clamp(completedPlanDays / exam.dailyPlan.length, 0, 1)
      : null;

  if (topicRatio === null && planRatio === null) {
    exam.readinessScore = 0;
    return;
  }

  if (topicRatio !== null && planRatio !== null) {
    exam.readinessScore = Math.round(((topicRatio * 0.7) + (planRatio * 0.3)) * 100);
    return;
  }

  exam.readinessScore = Math.round((topicRatio ?? planRatio) * 100);
};

// Legacy endpoint used by existing mind-map flow.
export const generateExamPlan = async (req, res) => {
  try {
    const modulesData = req.body.modulesData ? JSON.parse(req.body.modulesData) : [];
    const planCategory = req.body.planCategory || "Official";
    const dailyHours = req.body.dailyHours || 4;

    const subjectsString = modulesData.map((m) => `${m.id} ${m.name}`).join(", ");
    const allTopics = modulesData.map((m) => (m.topics ? m.topics.join(", ") : "")).join(" | ");

    const systemRulesPrompt = `
      Create a personalized study plan for an upcoming exam.
      Plan Type: ${planCategory}
      Modules: ${subjectsString || "Not specified"}
      Coverage Topics: ${allTopics || "General syllabus"}
      Daily Hours: ${dailyHours}

      Return strict JSON for a mind map structure.
    `;

    const pythonFormData = new FormData();
    pythonFormData.append("systemPrompt", systemRulesPrompt);
    pythonFormData.append("planCategory", planCategory);
    pythonFormData.append("dailyHours", dailyHours);
    pythonFormData.append("modulesData", JSON.stringify(modulesData));

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        pythonFormData.append("outlines", file.buffer, file.originalname);
      });
    }

    const pythonResponse = await axios.post("http://localhost:8000/api/generate-plan", pythonFormData, {
      headers: {
        ...pythonFormData.getHeaders()
      }
    });

    return res.status(200).json({
      success: true,
      data: pythonResponse.data.data
    });
  } catch (error) {
    console.error("Error communicating with Python AI Service:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Study plan generation failed in microservice",
      error: error.message
    });
  }
};

export const createExam = async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      examDate,
      examType = "final",
      difficulty = "medium",
      coverageTopics = [],
      totalTopics,
      completedTopics
    } = req.body || {};

    if (!subjectCode || !subjectName || !examDate) {
      return res.status(400).json({
        success: false,
        message: "subjectCode, subjectName and examDate are required"
      });
    }

    const total = Math.max(Number(totalTopics || coverageTopics.length || 0), 0);
    const completed = clamp(Number(completedTopics || 0), 0, total || Number.MAX_SAFE_INTEGER);
    const readinessScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    const exam = await Exam.create({
      user: req.user._id,
      student_id: String(req.user._id),
      subjectCode,
      subjectName,
      examDate,
      examType,
      difficulty,
      coverageTopics,
      totalTopics: total,
      completedTopics: completed,
      readinessScore
    });

    return res.status(201).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create exam", error: error.message });
  }
};

export const getUserExams = async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user._id })
      .sort({ examDate: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: exams });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch exams", error: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updates = { ...(req.body || {}) };

    const exam = await Exam.findOne({ _id: examId, user: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    Object.assign(exam, updates);

    if (Number.isFinite(Number(exam.totalTopics)) && Number.isFinite(Number(exam.completedTopics)) && Number(exam.totalTopics) > 0) {
      exam.completedTopics = clamp(Number(exam.completedTopics), 0, Number(exam.totalTopics));
    }

    recomputeReadiness(exam);

    await exam.save();
    return res.status(200).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update exam", error: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const deleted = await Exam.findOneAndDelete({ _id: examId, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    return res.status(200).json({ success: true, message: "Exam deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete exam", error: error.message });
  }
};

export const updatePreparationTracker = async (req, res) => {
  try {
    const { examId } = req.params;
    const { totalTopics, completedTopics } = req.body || {};

    const exam = await Exam.findOne({ _id: examId, user: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    if (Number.isFinite(Number(totalTopics))) {
      exam.totalTopics = Math.max(0, Number(totalTopics));
    }
    if (Number.isFinite(Number(completedTopics))) {
      exam.completedTopics = Math.max(0, Number(completedTopics));
    }

    if (exam.totalTopics > 0) {
      exam.completedTopics = clamp(exam.completedTopics, 0, exam.totalTopics);
    }

    recomputeReadiness(exam);

    await exam.save();
    return res.status(200).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update preparation tracker", error: error.message });
  }
};

export const getExamOverview = async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user._id, status: "scheduled" })
      .sort({ examDate: 1 })
      .lean();

    const now = Date.now();
    const nextExam = exams.find((exam) => new Date(exam.examDate).getTime() >= now) || null;

    return res.status(200).json({
      success: true,
      data: {
        totalExams: exams.length,
        nextExam,
        subjectTracker: exams.map((exam) => ({
          examId: exam._id,
          subjectCode: exam.subjectCode,
          subjectName: exam.subjectName,
          examDate: exam.examDate,
          totalTopics: exam.totalTopics || 0,
          completedTopics: exam.completedTopics || 0,
          readinessScore: exam.readinessScore || 0,
          countdownMs: Math.max(0, new Date(exam.examDate).getTime() - now)
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch exam overview", error: error.message });
  }
};

export const generateStudyRoadmap = async (req, res) => {
  try {
    const { examId, examDate, difficulty, coverageTopics = [], freeHoursPerDay } = req.body || {};

    let selectedExam = null;
    if (examId) {
      selectedExam = await Exam.findOne({ _id: examId, user: req.user._id });
      if (!selectedExam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
    }

    const effectiveExamDate = selectedExam?.examDate || examDate;
    if (!effectiveExamDate) {
      return res.status(400).json({ success: false, message: "examDate or examId is required" });
    }

    const effectiveDifficulty = selectedExam?.difficulty || difficulty || "medium";
    const effectiveTopics = selectedExam?.coverageTopics?.length
      ? selectedExam.coverageTopics
      : coverageTopics;

    const freeHours = Number.isFinite(Number(freeHoursPerDay))
      ? Number(freeHoursPerDay)
      : await estimateFreeHoursFromTimetable(req.user._id);

    const roadmapPayload = buildRoadmap({
      examDate: effectiveExamDate,
      topics: effectiveTopics,
      difficulty: effectiveDifficulty,
      freeHoursPerDay: freeHours
    });

    if (selectedExam) {
      selectedExam.dailyPlan = roadmapPayload.roadmap.map((d) => ({
        date: d.date,
        topics: d.tasks,
        estimatedHours: d.estimatedHours,
        isCompleted: false
      }));
      recomputeReadiness(selectedExam);
      await selectedExam.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        freeHoursPerDay: freeHours,
        ...roadmapPayload
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate study roadmap", error: error.message });
  }
};

export const generateAiStudyAssistant = async (req, res) => {
  try {
    const { examId, subjectName, examDate, difficulty } = req.body || {};

    let selectedExam = null;
    if (examId) {
      selectedExam = await Exam.findOne({ _id: examId, user: req.user._id }).lean();
    }

    const effectiveSubject = selectedExam?.subjectName || subjectName || "Selected Subject";
    const effectiveExamDate = selectedExam?.examDate || examDate;
    const effectiveDifficulty = selectedExam?.difficulty || difficulty || "medium";
    const effectiveTopics = selectedExam?.coverageTopics || [];

    const notesText = await extractNotesText(req.files || []);
    const freeHoursPerDay = await estimateFreeHoursFromTimetable(req.user._id);
    const roadmap = buildRoadmap({
      examDate: effectiveExamDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      topics: effectiveTopics,
      difficulty: effectiveDifficulty,
      freeHoursPerDay
    });

    let payload = fallbackAiPayload({ subjectName: effectiveSubject, roadmap });

    try {
      assertOpenAIConfigured();

      const prompt = `
You are an exam preparation assistant.

Return strict JSON with this schema:
{
  "summary": "string",
  "flashcards": [{ "front": "string", "back": "string" }],
  "keyQuestions": ["string"],
  "smartRevisionPlan": [{ "date": "YYYY-MM-DD", "tasks": ["string"], "estimatedHours": 2.5 }]
}

Context:
- Subject: ${effectiveSubject}
- Difficulty: ${effectiveDifficulty}
- Exam Date: ${effectiveExamDate || "not provided"}
- Topics: ${effectiveTopics.join(", ") || "not provided"}
- Suggested free hours/day from timetable: ${freeHoursPerDay}

Notes extract (truncated):
${(notesText || "No notes text provided").slice(0, 12000)}

Keep output concise and practical for university exams.
      `;

      const completion = await createChatCompletion({
        model: getDefaultChatModel(),
        messages: [
          { role: "system", content: "You output strict JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.35
      });

      const raw = getChatCompletionText(completion);
      const parsed = parseJsonLoose(raw, null);
      if (parsed && typeof parsed === "object") {
        payload = {
          summary: parsed.summary || payload.summary,
          flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards.slice(0, 20) : payload.flashcards,
          keyQuestions: Array.isArray(parsed.keyQuestions) ? parsed.keyQuestions.slice(0, 20) : payload.keyQuestions,
          smartRevisionPlan: Array.isArray(parsed.smartRevisionPlan) && parsed.smartRevisionPlan.length > 0
            ? parsed.smartRevisionPlan
            : payload.smartRevisionPlan
        };
      }
    } catch (error) {
      console.warn("AI study assistant fallback used:", error.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...payload,
        meta: {
          freeHoursPerDay,
          sourceFiles: (req.files || []).map((f) => f.originalname),
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate AI study assistant output", error: error.message });
  }
};

export const updateRoadmapDayStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { date, isCompleted } = req.body || {};

    if (!date) {
      return res.status(400).json({ success: false, message: "date is required" });
    }

    const exam = await Exam.findOne({ _id: examId, user: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const idx = Array.isArray(exam.dailyPlan)
      ? exam.dailyPlan.findIndex((d) => String(d.date) === String(date))
      : -1;

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Roadmap day not found" });
    }

    exam.dailyPlan[idx].isCompleted = Boolean(isCompleted);
    recomputeReadiness(exam);
    await exam.save();

    return res.status(200).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update roadmap day status", error: error.message });
  }
};