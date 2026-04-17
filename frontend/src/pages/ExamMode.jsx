import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import SetupExamForm from '../components/Exam/SetupExamForm';
import StudyPlanMindMap from '../components/Exam/StudyPlanMindMap';
import StudyPilot from '../components/Exam/StudyPilot'; // Study Pilot Import කර ඇත
import '../styles/ExamMode.css';
import '../styles/StudyPilot.css';

//UI Icons import
import schoolIcon from '../assets/school.png';
import personIcon from '../assets/person.png';
import assignmentIcon from '../assets/assignment.png';
import rocketIcon from '../assets/rocket_launch.png';
import psychologyIcon from '../assets/psychology.jpg';





const ExamMode = () => {
    // TAKE currentExam AND currentPlan from Redux store
    const { currentExam, currentPlan } = useSelector((state) => state.exam);
    const [showSetup, setShowSetup] = useState(false);
    
    // New State to track active view (dashboard or study pilot)
    const [activeView, setActiveView] = useState('dashboard');

    // Sidebar open/close state
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    // check today tasks
    const todaysWork = currentExam?.dailyPlan?.find(p => p.date === todayStr);

    return (
        <div className="scc-exam-layout">
    {/* --- SIDEBAR --- */}
    <aside className={`scc-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: 'pointer' }}>
            <img src={schoolIcon} alt="school" className="custom-img-icon brand-icon" />
            {sidebarOpen && <h2>SCC EXAM MODE</h2>}
        </div>

        {/* මෙනුව (nav) සැමවිටම පෙන්වීමට condition එකෙන් ඉවත් කර ඇත */}
        <nav className="sidebar-nav">
            
            {/* Dashboard Button */}
            <a 
                href="#" 
                className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
            >
                <img src={personIcon} alt="person" className="custom-img-icon" />
                {/* Sidebar එක open නම් පමණක් අකුරු පෙන්වයි */}
                {sidebarOpen && <span>Student Dashboard</span>}
            </a>
            
            {/* Setup Study Plans Button */}
            <a 
                href="#" 
                className="nav-item" 
                onClick={(e) => { e.preventDefault(); setShowSetup(true); }}
            >
                <img src={assignmentIcon} alt="assignment" className="custom-img-icon" />
                {sidebarOpen && <span>Setup Your Study Plans</span>}
            </a>
            
            {/* Study Pilot Button */}
            <a 
                href="#" 
                className={`nav-item ${activeView === 'studyPilot' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('studyPilot'); }}
            >
                <img src={rocketIcon} alt="rocket_launch" className="custom-img-icon" />
                {sidebarOpen && <span>Study Pilot</span>}
            </a>
            
            {/* Chat Button */}
            <a href="#" className="nav-item">
                <img src={psychologyIcon} alt="psychology" className="custom-img-icon" />
                {sidebarOpen && <span>Chat</span>}
            </a>
            
        </nav>
    </aside>


            {/* --- MAIN CONTENT --- */}
            <main className="scc-main-container">
                <div className="scc-content-scroll">
                    
                    {/*  UI change acco.tho the ACTIVE VIEW */}
                    {activeView === 'dashboard' ? (
                        <>
                            <div className="dashboard-grid">
                                <div className="tasks-column" style={{ display: 'flex', flexDirection: 'column' }}>
                                    {currentPlan ? (
                                        <div className="mindmap-dashboard-view" style={{ flexGrow: 1, minHeight: '500px' }}>
                                            <div className="section-header">
                                                <h2 className="section-title">YOUR AI STUDY PLAN MIND MAP</h2>
                                            </div>
                                            <StudyPlanMindMap aiPlanData={currentPlan} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="section-header">
                                                <h2 className="section-title">WHAT SHOULD I DO TODAY</h2>
                                                <span className="date-tag">{todayFormatted}</span>
                                            </div>

                                            <div className="task-list">
                                                {!currentExam ? (
                                                    <div className="empty-tasks-msg">
                                                        <p style={{ color: '#94a3b8' }}>No active exams. Click "Setup Your Study Plans" to generate a plan.</p>
                                                    </div>
                                                ) : todaysWork && todaysWork.topics.length > 0 ? (
                                                    todaysWork.topics.map((topic, i) => (
                                                        <div key={i} className={`scc-task-card ${i === 0 ? 'priority' : ''}`}>
                                                            <input type="checkbox" className="task-check" />
                                                            <div className="task-details">
                                                                <h4>{topic}</h4>
                                                                <p>{currentExam.module_name} • Daily Session</p>
                                                            </div>
                                                            {i === 0 && <span className="priority-tag">PRIORITY</span>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="empty-tasks-msg">
                                                        <p style={{ color: '#94a3b8' }}>No specific tasks for today. Great job keeping up! 🎉</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : activeView === 'studyPilot' ? (
                        /* --- Study Pilot part --- */
                        <StudyPilot />
                    ) : null}

                </div>
            </main>
            
            {showSetup && <SetupExamForm onClose={() => setShowSetup(false)} />}
        </div>
    );
};

export default ExamMode;