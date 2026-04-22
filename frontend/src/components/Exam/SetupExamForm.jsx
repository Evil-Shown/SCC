import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, ChevronRight, FileText, GraduationCap, Layers3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { createExamPlan, clearCurrentPlan } from '../../features/exam/examSlice';
import StudyPlanMindMap from './StudyPlanMindMap';

const SetupExamForm = ({ onClose }) => {
    const dispatch = useDispatch();
    
    // Redux store එකෙන් loading, error සහ currentPlan ලබා ගැනීම
    const { loading, error, currentPlan } = useSelector((state) => state.exam);

    const [planCategory, setPlanCategory] = useState('Official'); 

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [schedule, setSchedule] = useState(
        DAYS.map(day => ({ day, isFree: false, hours: 2 }))
    );
    const freeDaysCount = schedule.filter((day) => day.isFree).length;
    const activeDays = schedule.filter((day) => day.isFree).map((day) => `${day.day.slice(0, 3)} • ${day.hours}h`);

    const handleScheduleChange = (index, field, value) => {
        const updated = [...schedule];
        updated[index][field] = value;
        setSchedule(updated);
    };

    const [modules, setModules] = useState([
        {
            id: '', name: '', examDate: '', examTime: '', examType: 'FINAL', difficulty: 'Medium', instructions: ''
        }
    ]);

    const handleModuleChange = (index, field, value) => {
        const updatedModules = [...modules];
        updatedModules[index][field] = value;
        setModules(updatedModules);
    };

    const addModule = () => {
        setModules([...modules, {
            id: '', name: '', examDate: '', examTime: '', examType: 'FINAL', difficulty: 'Medium', instructions: ''
        }]);
    };

    const removeModule = (indexToRemove) => {
        const updatedModules = modules.filter((_, index) => index !== indexToRemove);
        setModules(updatedModules);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            student_id: '12345', 
            planCategory,
            modulesData: modules,
            scheduleData: schedule
        };

        try {
            await dispatch(createExamPlan(payload)).unwrap();
        } catch (err) {
            console.error("Failed to generate exam plan:", err);
        }
    };

    const handleCreateNew = () => {
        dispatch(clearCurrentPlan());
        setModules([{ id: '', name: '', examDate: '', examTime: '', examType: 'FINAL', difficulty: 'Medium', instructions: '' }]);
    };

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="modal-overlay exam-modal-overlay">
            <div className="modal-content exam-modal-content" style={{ maxWidth: currentPlan ? '1000px' : '800px', width: '100%' }}>
                <div className="modal-header exam-modal-header">
                    <div className="exam-modal-heading">
                        <div className="exam-header-main">
                            <div className="exam-brand-icon">
                                <Sparkles size={20} fill="var(--accent-primary)" fillOpacity={0.2} />
                            </div>
                            <div>
                                <h2 className="exam-title-text">{currentPlan ? "Review AI Study Plan" : "Study Plan Architect"}</h2>
                                <p className="exam-subtitle-text">{currentPlan ? 'Personalized roadmap generated for your upcoming exams.' : 'Design your exam schedule with AI-powered optimization.'}</p>
                            </div>
                        </div>
                    </div>
                    <button className="close-btn exam-close-btn" onClick={onClose} disabled={loading} aria-label="Close setup form">
                        <span className="exam-close-btn__glyph" aria-hidden="true">X</span>
                    </button>
                </div>
                
                {error && <div style={{color: '#ef4444', marginBottom: '10px', fontWeight: 'bold'}}>{error.error || error.message}</div>}

                {currentPlan ? (
                    <div className="mindmap-container">
                        <StudyPlanMindMap aiPlanData={currentPlan} />
                        <div className="exam-modal-footer-actions">
                            <button className="btn-secondary" type="button" onClick={handleCreateNew}>Create New Plan</button>
                            <button className="btn-primary" type="button" onClick={onClose}>Done</button>
                        </div>
                    </div>
                ) : (
                    <div className="exam-setup-layout">
                        <aside className="exam-setup-sidebar">
                            <div className="exam-setup-summary-card">
                                <div className="exam-setup-summary-card__top">
                                    <div className="exam-section-kicker">Plan Snapshot</div>
                                    <GraduationCap size={16} />
                                </div>
                                <div className="exam-setup-summary-card__row">
                                    <span>Added Modules</span>
                                    <strong>{modules.length}</strong>
                                </div>
                                <div className="exam-setup-summary-card__row">
                                    <span>Study Days</span>
                                    <strong>{freeDaysCount}</strong>
                                </div>
                                <div className="exam-setup-summary-card__row">
                                    <span>Plan Category</span>
                                    <strong>{planCategory}</strong>
                                </div>
                                <div className="exam-setup-summary-card__note">
                                    {activeDays.length > 0 ? activeDays.join(' · ') : 'No free days selected yet.'}
                                </div>
                            </div>

                            <div className="exam-setup-summary-card exam-setup-summary-card--soft">
                                <div className="exam-setup-summary-card__top">
                                    <div className="exam-section-kicker">Quick Workflow</div>
                                    <Layers3 size={16} />
                                </div>
                                <ol className="exam-step-list">
                                    <li>Add modules & dates</li>
                                    <li>Mark study days</li>
                                    <li>Generate AI plan</li>
                                </ol>
                            </div>
                        </aside>

                        <div className="exam-setup-main">
                            <form onSubmit={handleSubmit} className="exam-form-container">
                                <div className="exam-setup-main__header">
                                    <div>
                                        <span className="exam-section-kicker">Module Selection</span>
                                        <h3>Define your exam scope</h3>
                                    </div>
                                    <div className="exam-setup-main__count">
                                        <Layers3 size={16} />
                                        <span>{modules.length} {modules.length === 1 ? 'Module' : 'Modules'}</span>
                                    </div>
                                </div>

                                <div className="form-group exam-plan-toggle-row">
                            <label className={`exam-toggle-card ${planCategory === 'Official' ? 'active' : ''}`}>
                                <input type="radio" value="Official" checked={planCategory === 'Official'} onChange={(e) => setPlanCategory(e.target.value)} /> Official
                            </label>
                            <label className={`exam-toggle-card ${planCategory === 'Non-official' ? 'active' : ''}`}>
                                <input type="radio" value="Non-official" checked={planCategory === 'Non-official'} onChange={(e) => setPlanCategory(e.target.value)} /> Non-official
                            </label>
                                </div>

                                {modules.map((mod, index) => (
                                    <div key={index} className="exam-module-card">
                                <div className="exam-module-card__header">
                                    <div>
                                        <span className="exam-section-kicker">Module {index + 1}</span>
                                        <h4>Subject information</h4>
                                    </div>
                                {modules.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeModule(index)} 
                                        className="exam-remove-module-btn"
                                    >
                                        <Trash2 size={14} /> Remove
                                    </button>
                                )}
                                </div>

                                <div className="exam-input-grid exam-input-grid--two">
                                    <div className="form-group">
                                        <label>Module ID & Name</label>
                                        <input className="exam-field" type="text" placeholder="ID" value={mod.id} onChange={(e) => handleModuleChange(index, 'id', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        <input className="exam-field" type="text" placeholder="Name" value={mod.name} onChange={(e) => handleModuleChange(index, 'name', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="exam-input-grid exam-input-grid--two">
                                    <div className="form-group">
                                        <label>Exam Date & Time</label>
                                        <input className="exam-field" type="date" value={mod.examDate} onChange={(e) => handleModuleChange(index, 'examDate', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        <input className="exam-field" type="time" value={mod.examTime} onChange={(e) => handleModuleChange(index, 'examTime', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="exam-input-grid exam-input-grid--two">
                                    <div className="form-group">
                                        <label>Exam Type</label>
                                        <select className="exam-field" value={mod.examType} onChange={(e) => handleModuleChange(index, 'examType', e.target.value)}>
                                            <option value="Lab test">Lab test</option>
                                            <option value="VIVA">VIVA</option>
                                            <option value="MID">MID</option>
                                            <option value="FINAL">FINAL</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Module Difficulty</label>
                                        <select className="exam-field" value={mod.difficulty} onChange={(e) => handleModuleChange(index, 'difficulty', e.target.value)}>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Exam instructions & User requests(text)</label>
                                    <textarea className="exam-field exam-textarea" placeholder="Ex: Focus more on practicals..." value={mod.instructions} onChange={(e) => handleModuleChange(index, 'instructions', e.target.value)} rows="2" />
                                </div>
                                    </div>
                                ))}

                                <button type="button" onClick={addModule} className="btn-secondary exam-inline-action">
                                    <Plus size={16} /> Add More Modules
                                </button>

                                <div className="exam-days-section">
                                    <div className="exam-days-section__head">
                                        <div>
                                            <span className="exam-section-kicker">Weekly Schedule</span>
                                            <label>Set your study availability</label>
                                        </div>
                                    </div>

                                    <div className="exam-days-selection">
                                        {schedule.map((dayItem, idx) => (
                                            <div key={idx} className={`exam-day-item ${dayItem.isFree ? 'is-active' : ''}`}>
                                                <div className="exam-day-item__top">
                                                    <label className="exam-day-checkbox">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={dayItem.isFree} 
                                                            onChange={(e) => handleScheduleChange(idx, 'isFree', e.target.checked)} 
                                                        />
                                                        <span className="day-name">{dayItem.day}</span>
                                                    </label>
                                                </div>
                                                {dayItem.isFree && (
                                                    <div className="exam-day-item__input">
                                                        <input 
                                                            type="number" 
                                                            min="1" max="24" 
                                                            value={dayItem.hours} 
                                                            onChange={(e) => handleScheduleChange(idx, 'hours', e.target.value)} 
                                                            className="exam-tiny-field"
                                                        />
                                                        <span>hrs study</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="exam-form-footer">
                                    <button type="submit" className="btn-primary exam-btn-submit" disabled={loading}>
                                        {loading ? "Generating AI Plan..." : "Confirm & Generate"} <ChevronRight size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default SetupExamForm;