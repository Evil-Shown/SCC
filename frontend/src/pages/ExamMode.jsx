import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import SetupExamForm from '../components/Exam/SetupExamForm';
import StudyPlanMindMap from '../components/Exam/StudyPlanMindMap';
import StudyPilot from '../components/Exam/StudyPilot'; // Study Pilot Import කර ඇත
import '../styles/ExamMode.css';
import '../styles/StudyPilot.css';

const ExamMode = () => {
    // TAKE currentExam AND currentPlan from Redux store
    const { currentExam, currentPlan } = useSelector((state) => state.exam);
    const [showSetup, setShowSetup] = useState(false);
    
    // UI එක (Dashboard ද, Study Pilot ද) පාලනය කිරීමට අලුත් State එකක්
    const [activeView, setActiveView] = useState('dashboard');

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    // check today tasks
    const todaysWork = currentExam?.dailyPlan?.find(p => p.date === todayStr);

    return (
        <div className="scc-exam-layout">
            {/* --- SIDEBAR --- */}
            <aside className="scc-sidebar">
                <div className="sidebar-brand">
                    <span className="material-symbols-outlined brand-icon">bolt</span>
                    <h2>SCC EXAM MODE</h2>
                </div>

                <div className="sidebar-user">
                    <img 
                        src="https://ui-avatars.com/api/?name=Mithun+Madusanka&background=81a1c6&color=fff&bold=true" 
                        alt="Profile" 
                        className="user-avatar" 
                    />
                    <div className="user-info">
                        <h4>Mithun Madusanka</h4>
                        <p>Student Account</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {/* Dashboard Button */}
                    <a 
                        href="#" 
                        className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
                    >
                        <span className="material-symbols-outlined">dashboard</span> 
                        Student Dashboard
                    </a>
                    
                    {/* Setup Study Plans Button */}
                    <a 
                        href="#" 
                        className="nav-item" 
                        onClick={(e) => { e.preventDefault(); setShowSetup(true); }}
                    >
                        <span className="material-symbols-outlined">calendar_month</span> 
                        Setup Your Study Plans
                    </a>
                    
                    {/* Study Pilot Button */}
                    <a 
                        href="#" 
                        className={`nav-item ${activeView === 'studyPilot' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('studyPilot'); }}
                    >
                        <span className="material-symbols-outlined">rocket_launch</span> 
                        Study Pilot
                    </a>
                    
                    {/* Chat Button */}
                    <a href="#" className="nav-item">
                        <span className="material-symbols-outlined">chat</span> 
                        Chat
                    </a>
                </nav>

                <div className="sidebar-footer">
                    
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="scc-main-container">
                {/* Top Header - මෙය හැමවිටම දිස්විය යුතුයි */}
                <header className="scc-top-header">
                    <div className="search-bar">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Search exams, resources, or topics..." />
                    </div>
                    <div className="header-actions">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="material-symbols-outlined">settings</span>
                    </div>
                </header>

                <div className="scc-content-scroll">
                    
                    {/* සක්‍රීය View එක මත පදනම්ව UI එක වෙනස් කිරීම */}
                    {activeView === 'dashboard' ? (
                        <>
                            {/* --- Dashboard එකට අදාළ පැරණි කේතය --- */}
                            <section className="doomsday-section">
                                <h3 className="doomsday-title">FINAL EXAMS</h3>
                                <div className="clock-grid">
                                    <div className="clock-box"><h1>12</h1><p>DAYS</p></div>
                                    <div className="clock-box"><h1>08</h1><p>HOURS</p></div>
                                    <div className="clock-box"><h1>45</h1><p>MINUTES</p></div>
                                    <div className="clock-box"><h1>12</h1><p>SECONDS</p></div>
                                </div>
                            </section>

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

                                <div className="stats-column">
                                    <div className="scc-card readiness-card">
                                        <div className="card-header">
                                            <p>READINESS SCORE</p>
                                            <span className="material-symbols-outlined">analytics</span>
                                        </div>
                                        <h1>{currentExam?.readinessScore || 0}<span>%</span></h1>
                                        <p className="growth-text">Based on your plan</p>
                                        <div className="progress-container">
                                            <div className="progress-bar" style={{ width: `${currentExam?.readinessScore || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeView === 'studyPilot' ? (
                        /* --- Study Pilot එක පෙන්වන කොටස --- */
                        <StudyPilot />
                    ) : null}

                </div>
            </main>
            
            {showSetup && <SetupExamForm onClose={() => setShowSetup(false)} />}
        </div>
    );
};

export default ExamMode;