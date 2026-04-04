import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
    buildAiStudyAssistant,
    buildStudyRoadmap,
    createUserExam,
    fetchExamOverview,
    fetchUserExams,
    removeUserExam,
    saveRoadmapDayStatus,
    savePreparationTracker,
    updateUserExam
} from "../features/exam/examSlice";
import "../styles/ExamMode.css";

const diffCountdown = (targetDate) => {
    const now = Date.now();
    const target = new Date(targetDate).getTime();
    const diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
};

const ExamMode = () => {
    const dispatch = useDispatch();
    const { theme } = useTheme();
    const { exams, overview, roadmap, aiAssistant, loading, error } = useSelector((state) => state.exam);

    const [selectedExamId, setSelectedExamId] = useState("");
    const [notesFiles, setNotesFiles] = useState([]);
    const [ticker, setTicker] = useState(Date.now());
    const [trackerDrafts, setTrackerDrafts] = useState({});
    const [editExamId, setEditExamId] = useState("");
    const [examDrafts, setExamDrafts] = useState({});
    const [form, setForm] = useState({
        subjectCode: "",
        subjectName: "",
        examDate: "",
        examType: "final",
        difficulty: "medium",
        coverageTopics: ""
    });

    useEffect(() => {
        dispatch(fetchUserExams());
        dispatch(fetchExamOverview());
    }, [dispatch]);

    useEffect(() => {
        const id = setInterval(() => setTicker(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!selectedExamId && exams.length > 0) {
            setSelectedExamId(exams[0]._id);
        }
    }, [selectedExamId, exams]);

    useEffect(() => {
        const nextDrafts = {};
        exams.forEach((exam) => {
            nextDrafts[exam._id] = {
                completedTopics: Number(exam.completedTopics || 0),
                totalTopics: Number(exam.totalTopics || 0)
            };
        });
        setTrackerDrafts(nextDrafts);

        const nextExamDrafts = {};
        exams.forEach((exam) => {
            const examDateValue = exam.examDate ? new Date(exam.examDate) : null;
            const asLocal = examDateValue && !Number.isNaN(examDateValue.getTime())
                ? new Date(examDateValue.getTime() - (examDateValue.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
                : "";

            nextExamDrafts[exam._id] = {
                subjectCode: exam.subjectCode || "",
                subjectName: exam.subjectName || "",
                examDate: asLocal,
                examType: exam.examType || "final",
                difficulty: exam.difficulty || "medium",
                coverageTopics: Array.isArray(exam.coverageTopics) ? exam.coverageTopics.join(", ") : ""
            };
        });
        setExamDrafts(nextExamDrafts);
    }, [exams]);

    const selectedExam = useMemo(
        () => exams.find((exam) => exam._id === selectedExamId) || overview?.nextExam || null,
        [exams, selectedExamId, overview]
    );

    const countdown = selectedExam?.examDate ? diffCountdown(selectedExam.examDate) : { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const handleCreateExam = async (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            coverageTopics: form.coverageTopics
                .split(",")
                .map((topic) => topic.trim())
                .filter(Boolean)
        };

        await dispatch(createUserExam(payload)).unwrap();
        setForm({
            subjectCode: "",
            subjectName: "",
            examDate: "",
            examType: "final",
            difficulty: "medium",
            coverageTopics: ""
        });
        dispatch(fetchExamOverview());
    };

    const handleDeleteExam = async (examId) => {
        await dispatch(removeUserExam(examId)).unwrap();
        dispatch(fetchExamOverview());
    };

    const handleSaveExamEdit = async (examId) => {
        const draft = examDrafts[examId];
        if (!draft) return;

        await dispatch(
            updateUserExam({
                examId,
                payload: {
                    subjectCode: draft.subjectCode,
                    subjectName: draft.subjectName,
                    examDate: draft.examDate,
                    examType: draft.examType,
                    difficulty: draft.difficulty,
                    coverageTopics: String(draft.coverageTopics || "")
                        .split(",")
                        .map((topic) => topic.trim())
                        .filter(Boolean)
                }
            })
        ).unwrap();

        setEditExamId("");
        dispatch(fetchExamOverview());
    };

    const handleSaveTracker = async (exam) => {
        const draft = trackerDrafts[exam._id] || {
            completedTopics: Number(exam.completedTopics || 0),
            totalTopics: Number(exam.totalTopics || 0)
        };

        await dispatch(
            savePreparationTracker({
                examId: exam._id,
                payload: {
                    totalTopics: Number(draft.totalTopics || 0),
                    completedTopics: Number(draft.completedTopics || 0)
                }
            })
        ).unwrap();
        dispatch(fetchExamOverview());
    };

    const handleGenerateRoadmap = async () => {
        if (!selectedExam) return;
        await dispatch(buildStudyRoadmap({ examId: selectedExam._id })).unwrap();
        dispatch(fetchUserExams());
        dispatch(fetchExamOverview());
    };

    const handleGenerateAi = async () => {
        if (!selectedExam) return;
        const formData = new FormData();
        formData.append("examId", selectedExam._id);
        notesFiles.forEach((file) => formData.append("notes", file));
        await dispatch(buildAiStudyAssistant(formData)).unwrap();
    };

    const handleToggleRoadmapDay = async (date, isCompleted) => {
        if (!selectedExam?._id) return;
        await dispatch(
            saveRoadmapDayStatus({
                examId: selectedExam._id,
                payload: { date, isCompleted }
            })
        ).unwrap();
        dispatch(fetchExamOverview());
    };

    const roadmapDays = selectedExam?.dailyPlan?.length
        ? selectedExam.dailyPlan
        : (roadmap?.roadmap || []);

    return (
        <div className="exam-mode-page" data-theme={theme}>
            <header className="exam-topbar">
                <div>
                    <h1>Exam Mode</h1>
                    <p>Track deadlines, plan revision, and generate AI study assets from your notes.</p>
                </div>
                <Link to="/dashboard" className="exam-link-btn">Back to Dashboard</Link>
            </header>

            {error && <div className="exam-error">{String(error)}</div>}

            <section className="exam-countdown-card">
                <h2>Next Exam Countdown</h2>
                <p>{selectedExam ? `${selectedExam.subjectCode} - ${selectedExam.subjectName}` : "No exam selected"}</p>
                <div className="exam-clock-grid" key={ticker}>
                    <div><strong>{countdown.days}</strong><span>Days</span></div>
                    <div><strong>{countdown.hours}</strong><span>Hours</span></div>
                    <div><strong>{countdown.minutes}</strong><span>Minutes</span></div>
                    <div><strong>{countdown.seconds}</strong><span>Seconds</span></div>
                </div>
            </section>

            <div className="exam-grid">
                <section className="exam-card">
                    <h3>Add Exam</h3>
                    <form onSubmit={handleCreateExam} className="exam-form-grid">
                        <input
                            value={form.subjectCode}
                            onChange={(e) => setForm((prev) => ({ ...prev, subjectCode: e.target.value }))}
                            placeholder="Subject code"
                            required
                        />
                        <input
                            value={form.subjectName}
                            onChange={(e) => setForm((prev) => ({ ...prev, subjectName: e.target.value }))}
                            placeholder="Subject name"
                            required
                        />
                        <input
                            type="datetime-local"
                            value={form.examDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, examDate: e.target.value }))}
                            required
                        />
                        <select
                            value={form.examType}
                            onChange={(e) => setForm((prev) => ({ ...prev, examType: e.target.value }))}
                        >
                            <option value="final">Final</option>
                            <option value="midterm">Midterm</option>
                            <option value="lab">Lab</option>
                            <option value="viva">Viva</option>
                            <option value="other">Other</option>
                        </select>
                        <select
                            value={form.difficulty}
                            onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <input
                            value={form.coverageTopics}
                            onChange={(e) => setForm((prev) => ({ ...prev, coverageTopics: e.target.value }))}
                            placeholder="Topics comma-separated"
                        />
                        <button type="submit" disabled={loading}>Save Exam</button>
                    </form>
                </section>

                <section className="exam-card">
                    <h3>Exam Timetable (CRUD + Inline Edit)</h3>
                    <div className="exam-list">
                        {exams.map((exam) => (
                            <article key={exam._id} className={`exam-item ${selectedExamId === exam._id ? "active" : ""}`}>
                                {editExamId === exam._id ? (
                                    <div className="exam-inline-edit">
                                        <input
                                            value={examDrafts[exam._id]?.subjectCode || ""}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    subjectCode: e.target.value
                                                }
                                            }))}
                                            placeholder="Code"
                                        />
                                        <input
                                            value={examDrafts[exam._id]?.subjectName || ""}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    subjectName: e.target.value
                                                }
                                            }))}
                                            placeholder="Name"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={examDrafts[exam._id]?.examDate || ""}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    examDate: e.target.value
                                                }
                                            }))}
                                        />
                                        <select
                                            value={examDrafts[exam._id]?.examType || "final"}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    examType: e.target.value
                                                }
                                            }))}
                                        >
                                            <option value="final">Final</option>
                                            <option value="midterm">Midterm</option>
                                            <option value="lab">Lab</option>
                                            <option value="viva">Viva</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <select
                                            value={examDrafts[exam._id]?.difficulty || "medium"}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    difficulty: e.target.value
                                                }
                                            }))}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                        <input
                                            value={examDrafts[exam._id]?.coverageTopics || ""}
                                            onChange={(e) => setExamDrafts((prev) => ({
                                                ...prev,
                                                [exam._id]: {
                                                    ...(prev[exam._id] || {}),
                                                    coverageTopics: e.target.value
                                                }
                                            }))}
                                            placeholder="topic1, topic2"
                                        />
                                    </div>
                                ) : (
                                    <div onClick={() => setSelectedExamId(exam._id)}>
                                        <h4>{exam.subjectCode} - {exam.subjectName}</h4>
                                        <p>{new Date(exam.examDate).toLocaleString()}</p>
                                    </div>
                                )}

                                <div className="exam-item-actions">
                                    {editExamId === exam._id ? (
                                        <>
                                            <button type="button" onClick={() => handleSaveExamEdit(exam._id)}>Save</button>
                                            <button type="button" onClick={() => setEditExamId("")}>Cancel</button>
                                        </>
                                    ) : (
                                        <button type="button" onClick={() => setEditExamId(exam._id)}>Edit</button>
                                    )}
                                    <button type="button" onClick={() => handleDeleteExam(exam._id)}>Delete</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="exam-card exam-wide">
                    <h3>Subject Preparation Tracker</h3>
                    <div className="tracker-grid">
                        {exams.map((exam) => (
                            <div key={exam._id} className="tracker-item">
                                <div className="tracker-top">
                                    <strong>{exam.subjectName}</strong>
                                    <span>{exam.readinessScore || 0}%</span>
                                </div>
                                <div className="tracker-progress">
                                    <span style={{ width: `${exam.readinessScore || 0}%` }} />
                                </div>
                                <div className="tracker-edit">
                                    <label>
                                        Done
                                        <input
                                            type="number"
                                            min="0"
                                            value={trackerDrafts[exam._id]?.completedTopics ?? 0}
                                            onChange={(e) => {
                                                const nextValue = Number(e.target.value || 0);
                                                setTrackerDrafts((prev) => ({
                                                    ...prev,
                                                    [exam._id]: {
                                                        ...(prev[exam._id] || {}),
                                                        completedTopics: nextValue
                                                    }
                                                }));
                                            }}
                                        />
                                    </label>
                                    <label>
                                        Total
                                        <input
                                            type="number"
                                            min="0"
                                            value={trackerDrafts[exam._id]?.totalTopics ?? 0}
                                            onChange={(e) => {
                                                const nextValue = Number(e.target.value || 0);
                                                setTrackerDrafts((prev) => ({
                                                    ...prev,
                                                    [exam._id]: {
                                                        ...(prev[exam._id] || {}),
                                                        totalTopics: nextValue
                                                    }
                                                }));
                                            }}
                                        />
                                    </label>
                                    <button type="button" onClick={() => handleSaveTracker(exam)}>Update</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="exam-card">
                    <h3>Study Plan Generator</h3>
                    <p>Uses exam date, subject difficulty, and free hours inferred from your timetable.</p>
                    <button type="button" onClick={handleGenerateRoadmap} disabled={!selectedExam || loading}>
                        Generate Daily Roadmap
                    </button>

                    {roadmapDays?.length > 0 && (
                        <div className="roadmap-list">
                            {roadmapDays.slice(0, 14).map((day) => (
                                <div key={day.date} className="roadmap-item">
                                    <label className="roadmap-day-check">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(day.isCompleted)}
                                            onChange={(e) => handleToggleRoadmapDay(day.date, e.target.checked)}
                                        />
                                        <strong>{day.date}</strong>
                                    </label>
                                    <span>{day.estimatedHours || 0}h</span>
                                    <ul>
                                        {(day.tasks || day.topics || []).map((task) => <li key={task}>{task}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="exam-card">
                    <h3>AI Study Assistant</h3>
                    <p>Upload notes to generate summary, flashcards, key questions, and smart revision plan.</p>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.md"
                        onChange={(e) => setNotesFiles(Array.from(e.target.files || []))}
                    />
                    <button type="button" onClick={handleGenerateAi} disabled={!selectedExam || loading}>
                        Generate AI Materials
                    </button>

                    {aiAssistant && (
                        <div className="ai-output">
                            <h4>Summary</h4>
                            <p>{aiAssistant.summary}</p>

                            <h4>Flashcards</h4>
                            <ul>
                                {(aiAssistant.flashcards || []).slice(0, 8).map((card, idx) => (
                                    <li key={`${card.front}-${idx}`}><strong>{card.front}</strong>: {card.back}</li>
                                ))}
                            </ul>

                            <h4>Key Questions</h4>
                            <ul>
                                {(aiAssistant.keyQuestions || []).slice(0, 8).map((question, idx) => (
                                    <li key={`${question}-${idx}`}>{question}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ExamMode;