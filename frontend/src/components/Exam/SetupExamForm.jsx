import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: currentPlan ? '1000px' : '800px', width: '100%' }}>
                <div className="modal-header">
                    <h2>{currentPlan ? "YOUR AI STUDY PLAN" : "SETUP YOUR STUDY PLANS"}</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                {error && <div style={{color: '#ef4444', marginBottom: '10px', fontWeight: 'bold'}}>{error.error || error.message}</div>}

                {currentPlan ? (
                    <div className="mindmap-container">
                        <StudyPlanMindMap aiPlanData={currentPlan} />
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-secondary" onClick={handleCreateNew}>Create New Plan</button>
                            <button className="btn-primary" onClick={onClose}>Done</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="exam-form">
                        <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                            <label>
                                <input type="radio" value="Official" checked={planCategory === 'Official'} onChange={(e) => setPlanCategory(e.target.value)} /> Official
                            </label>
                            <label>
                                <input type="radio" value="Non-official" checked={planCategory === 'Non-official'} onChange={(e) => setPlanCategory(e.target.value)} /> Non-official
                            </label>
                        </div>

                        {modules.map((mod, index) => (
                            <div key={index} style={{ border: '1px solid #334155', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                                {modules.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeModule(index)} 
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        - Remove
                                    </button>
                                )}

                                <div className="form-group input-row">
                                    <div>
                                        <label>Module ID & Name</label>
                                        <input type="text" placeholder="ID" value={mod.id} onChange={(e) => handleModuleChange(index, 'id', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label>&nbsp;</label>
                                        <input type="text" placeholder="Name" value={mod.name} onChange={(e) => handleModuleChange(index, 'name', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group input-row">
                                    <div>
                                        <label>Exam Date & Time</label>
                                        <input type="date" value={mod.examDate} onChange={(e) => handleModuleChange(index, 'examDate', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label>&nbsp;</label>
                                        <input type="time" value={mod.examTime} onChange={(e) => handleModuleChange(index, 'examTime', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group input-row">
                                    <div>
                                        <label>Exam Type</label>
                                        <select value={mod.examType} onChange={(e) => handleModuleChange(index, 'examType', e.target.value)}>
                                            <option value="Lab test">Lab test</option>
                                            <option value="VIVA">VIVA</option>
                                            <option value="MID">MID</option>
                                            <option value="FINAL">FINAL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Module Difficulty</label>
                                        <select value={mod.difficulty} onChange={(e) => handleModuleChange(index, 'difficulty', e.target.value)}>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Exam instructions & User requests(text)</label>
                                    <textarea placeholder="Ex: Focus more on practicals..." value={mod.instructions} onChange={(e) => handleModuleChange(index, 'instructions', e.target.value)} rows="2" />
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addModule} className="btn-secondary" style={{ marginBottom: '20px' }}>
                            + Add More Modules
                        </button>

                        <div className="form-group">
                            <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Select free days for study</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {schedule.map((dayItem, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '120px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={dayItem.isFree} 
                                                onChange={(e) => handleScheduleChange(idx, 'isFree', e.target.checked)} 
                                            /> 
                                            {dayItem.day}
                                        </label>
                                        {dayItem.isFree && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input 
                                                    type="number" 
                                                    min="1" max="24" 
                                                    value={dayItem.hours} 
                                                    onChange={(e) => handleScheduleChange(idx, 'hours', e.target.value)} 
                                                    style={{ width: '60px', padding: '5px' }}
                                                />
                                                <span>hrs for study</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Generating AI Plan..." : "CONFIRM / Generate Plan"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SetupExamForm;