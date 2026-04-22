import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CalendarDays, ChevronRight, Clock3, FileText, GraduationCap, Rocket, Sparkles, Target, Layers3 } from 'lucide-react';
import StudentDashboardShell from '../components/StudentDashboardShell';
import SetupExamForm from '../components/Exam/SetupExamForm';
import StudyPlanMindMap from '../components/Exam/StudyPlanMindMap';
import StudyPilot from '../components/Exam/StudyPilot';
import '../styles/ExamMode.css';
import '../styles/StudyPilot.css';

//UI Icons import
import schoolIcon from '../assets/school.png';
import personIcon from '../assets/person.png';
import assignmentIcon from '../assets/assignment.png';
import rocketIcon from '../assets/rocket_launch.png';
import psychologyIcon from '../assets/psychology.jpg';

const summarizePlanTree = (plan) => {
    const summary = { nodes: 0, leaves: 0, depth: 0 };

    const walk = (node, depth = 1) => {
        if (!node || typeof node !== 'object') return;

        summary.nodes += 1;
        summary.depth = Math.max(summary.depth, depth);

        const children = Array.isArray(node.children) ? node.children : [];
        if (children.length === 0) {
            summary.leaves += 1;
            return;
        }

        children.forEach((child) => walk(child, depth + 1));
    };

    walk(plan);
    return summary;
};
const ExamMode = () => {
    const { currentExam, currentPlan } = useSelector((state) => state.exam);
    const [showSetup, setShowSetup] = useState(false);
    const [activeView, setActiveView] = useState('overview');

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysWork = currentExam?.dailyPlan?.find(p => p.date === todayStr);
    const planSummary = useMemo(() => summarizePlanTree(currentPlan), [currentPlan]);
    const planLabel = currentPlan?.data?.label || currentPlan?.label || 'Your AI study plan';
    const topicCount = todaysWork?.topics?.length || 0;

    const summaryCards = [
        { label: 'Plan nodes', value: planSummary.nodes || 0 },
        { label: 'Plan depth', value: planSummary.depth || 0 },
        { label: 'Leaf topics', value: planSummary.leaves || 0 },
        { label: 'Today\'s topics', value: topicCount },
    ];

    const toggleStudyPilot = () => {
        setActiveView((view) => (view === 'studyPilot' ? 'overview' : 'studyPilot'));
    };

    return (
        <StudentDashboardShell>
            <main className="exam-mode-page">
                <section className="bento-grid exam-grid">
                    <article className="bento-card exam-hero-card">
                        <div className="bento-badge">
                            <Sparkles size={12} />
                            <span>Exam Focus</span>
                        </div>
                        <h1 className="bento-hero__title">Exam Mode</h1>
                        <p className="bento-hero__desc">
                            A dashboard-style workspace for building AI study plans, tracking today&apos;s topics, and jumping into Study Pilot without breaking flow.
                        </p>

                        <div className="exam-hero-meta">
                            <span className="exam-chip"><CalendarDays size={14} /> {todayFormatted}</span>
                            <span className="exam-chip exam-chip--soft"><GraduationCap size={14} /> {currentPlan ? 'Plan ready' : 'No active plan'}</span>
                            <span className="exam-chip exam-chip--soft"><Target size={14} /> {activeView === 'studyPilot' ? 'Study Pilot' : 'Overview'}</span>
                        </div>

                        <div className="bento-hero__actions">
                            <button type="button" className="bento-btn" onClick={() => setShowSetup(true)}>
                                Build Study Plan <ChevronRight size={16} />
                            </button>
                            <button type="button" className={`bento-btn bento-btn--ghost ${activeView === 'studyPilot' ? 'is-active' : ''}`} onClick={toggleStudyPilot}>
                                <Rocket size={16} /> {activeView === 'studyPilot' ? 'Back to Overview' : 'Open Study Pilot'}
                            </button>
                        </div>
                    </article>

                    <aside className="bento-card exam-summary-card">
                        <div className="section-header exam-section-header">
                            <h2 className="section-title">Plan Snapshot</h2>
                            <span className="date-tag">{planLabel}</span>
                        </div>

                        <div className="exam-summary-grid">
                            {summaryCards.map((card) => (
                                <div key={card.label} className="exam-stat-card">
                                    <div className="exam-stat-card__icon"><Layers3 size={16} /></div>
                                    <div>
                                        <div className="exam-stat-card__value">{card.value}</div>
                                        <div className="exam-stat-card__label">{card.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="exam-summary-note">
                            {currentPlan
                                ? 'Your AI roadmap is live. Use the map below to follow the study structure or move into Study Pilot for AI-generated practice.'
                                : 'Create a plan to unlock the mind map, daily focus list, and study pilot tools.'}
                        </div>
                    </aside>

                    <article className="bento-card exam-main-card">
                        <div className="section-header exam-section-header">
                            <h2 className="section-title">{currentPlan ? 'Your AI Study Plan Mind Map' : 'Today\'s Focus'}</h2>
                            <button type="button" className="exam-inline-link" onClick={() => setShowSetup(true)}>
                                {currentPlan ? 'Regenerate plan' : 'Set up plan'}
                            </button>
                        </div>

                        {currentPlan ? (
                            <div className="exam-mindmap-shell">
                                <StudyPlanMindMap aiPlanData={currentPlan} />
                            </div>
                        ) : currentExam ? (
                            <div className="exam-task-stack">
                                {todaysWork?.topics?.length ? (
                                    todaysWork.topics.map((topic, index) => (
                                        <div key={topic + index} className={`scc-task-card exam-task-card ${index === 0 ? 'priority' : ''}`}>
                                            <input type="checkbox" className="task-check" />
                                            <div className="task-details">
                                                <h4>{topic}</h4>
                                                <p>{currentExam.module_name} • Daily Session</p>
                                            </div>
                                            {index === 0 && <span className="priority-tag">Priority</span>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="exam-empty-state">
                                        <p>No specific tasks for today. Your schedule is clear enough to review at a lighter pace.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="exam-empty-state">
                                <p>No study plan is active yet. Use the setup flow to generate a roadmap that looks and behaves like the rest of the dashboard.</p>
                            </div>
                        )}
                    </article>

                    <aside className="bento-card exam-side-card">
                        <div className="section-header exam-section-header">
                            <h2 className="section-title">Quick Actions</h2>
                            <span className="date-tag">One tap</span>
                        </div>

                        <div className="exam-action-list">
                            <button type="button" className="exam-action-btn" onClick={() => setShowSetup(true)}>
                                <span className="exam-action-btn__icon"><FileText size={16} /></span>
                                <span>
                                    <strong>Create / update plan</strong>
                                    <small>Use the AI plan builder</small>
                                </span>
                            </button>
                            <button type="button" className="exam-action-btn" onClick={toggleStudyPilot}>
                                <span className="exam-action-btn__icon"><Rocket size={16} /></span>
                                <span>
                                    <strong>Open Study Pilot</strong>
                                    <small>Generate summaries, quizzes, and mind maps</small>
                                </span>
                            </button>
                        </div>

                        <div className="exam-tip-card">
                            <div className="exam-tip-card__label">Today</div>
                            <div className="exam-tip-card__value">{todayFormatted}</div>
                            <p>
                                {topicCount > 0
                                    ? `You have ${topicCount} topic${topicCount === 1 ? '' : 's'} lined up for today.`
                                    : 'No tasks were generated for today yet.'}
                            </p>
                        </div>
                    </aside>

                    {activeView === 'studyPilot' && (
                        <section className="bento-card exam-pilot-card">
                            <div className="section-header exam-section-header">
                                <h2 className="section-title">Study Pilot</h2>
                                <span className="date-tag">AI tools</span>
                            </div>
                            <StudyPilot />
                        </section>
                    )}
                </section>
            </main>

            {showSetup && <SetupExamForm onClose={() => setShowSetup(false)} />}
        </StudentDashboardShell>
    );
};

export default ExamMode;