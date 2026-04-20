import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { generateStudyMaterials } from "../../features/exam/examSlice";
import StudyPlanMindMap from './StudyPlanMindMap'; 
import '../../styles/StudyPilot.css'; 

// ==========================================
// 💡 වෙනස: COMPONENTS පිටතට ගෙන ඒම (Fix for State Reset Issue)
// ==========================================

// --- 1. Summary UI ---
const RenderSummary = ({ data }) => {
    if (!data || typeof data !== 'object') return <p style={{color: '#ef4444'}}>NO Summary data</p>;
    let safeData = data?.summaryTitle ? data : (Object.values(data).find(v => v?.summaryTitle) || data);

    return (
        <div className="rendered-content summary-content" style={{ userSelect: 'text', cursor: 'text' }}>
            <h2 className="content-title">{safeData.summaryTitle || "Deep Document Summary"}</h2>
            <div className="summary-section">
                <h3>Key Concepts & Explanations</h3>
                {Array.isArray(safeData.keyPoints) ? (
                    safeData.keyPoints.map((p, i) => (
                        <div key={i} className="summary-point" style={{marginBottom: '20px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #38bdf8'}}>
                            {typeof p === 'object' ? (
                                <>
                                    <strong style={{color: '#38bdf8', fontSize: '1.2em', display: 'block', marginBottom: '8px'}}>{p.title || p.concept}</strong>
                                    <p style={{marginTop: '5px', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap'}}>{p.description || p.details}</p>
                                </>
                            ) : (
                                <p style={{lineHeight: '1.6', color: '#e2e8f0'}}>{p}</p>
                            )}
                        </div>
                    ))
                ) : <p>No detailed points found.</p>}
            </div>
            <div className="summary-section detailed-summary" style={{marginTop: '20px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px'}}>
                <h3 style={{color: '#22c55e'}}>Conclusion</h3>
                <p style={{lineHeight: '1.6', color: '#cbd5e1'}}>{safeData.detailedSummary || "No details provided."}</p>
            </div>
        </div>
    );
};


// --- 2. Flashcard Item UI (Flippable Fix) ---
const FlashcardItem = ({ front, back, index }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div 
            style={{ perspective: '1000px', width: '280px', height: '220px', cursor: 'pointer' }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div style={{
                width: '100%', height: '100%', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', 
                transformStyle: 'preserve-3d', position: 'relative',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
                {/* Front */}
                <div style={{
                    position: 'absolute', width: '100%', height: '100%', 
                    WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                    backgroundColor: '#1e293b', border: '2px solid #334155', borderRadius: '12px', padding: '20px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <span style={{ position: 'absolute', top: '10px', left: '15px', color: '#38bdf8', fontWeight: 'bold' }}>#{index}</span>
                    <h3 style={{ color: '#f8fafc', margin: 0 }}>{front || "Empty"}</h3>
                    <p style={{ color: '#64748b', fontSize: '13px', position: 'absolute', bottom: '10px' }}>Click to flip 🔄</p>
                </div>
                {/* Back */}
                <div style={{
                    position: 'absolute', width: '100%', height: '100%', 
                    WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
                    backgroundColor: '#0f172a', border: '2px solid #38bdf8', borderRadius: '12px', padding: '20px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                    transform: 'rotateY(180deg)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflowY: 'auto'
                }}>
                    <p style={{ color: '#f8fafc', margin: 0, fontSize: '15px', lineHeight: '1.6' }}>{back || "Empty"}</p>
                </div>
            </div>
        </div>
    );
};

// --- Flashcards Grid Wrapper ---
const RenderFlashcards = ({ data }) => {
    let safeData = Array.isArray(data) ? data : (Object.values(data).find(v => Array.isArray(v)) || []);
    if (!Array.isArray(safeData) || safeData.length === 0) return <p style={{color: '#ef4444'}}>Failed to generate Flashcards.</p>;

    return (
        <div className="rendered-content flashcards-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {safeData.map((card, i) => (
                <FlashcardItem key={i} front={card?.front} back={card?.back} index={i+1} />
            ))}
        </div>
    );
};


// --- EXACT Downloadable HTML Template User Requested ---
const generateQuizHTML = (quizData) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REST APIs Quiz</title>
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    .quiz-container { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; transition: border-left 0.3s ease; }
    .question { font-weight: bold; font-size: 1.1em; margin-bottom: 15px; color: #2c3e50; }
    .options-list { list-style-type: none; padding: 0; }
    .options-list li { margin-bottom: 10px; padding: 10px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; cursor: pointer; transition: background 0.2s, color 0.2s; }
    .options-list li:hover { background: #e2e6ea; }
    .options-list input[type="checkbox"] { margin-right: 10px; transform: scale(1.2); cursor: pointer; }
    .explanation-box { display: none; margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #3498db; border-radius: 4px; font-size: 0.95em; }
    .explanation-box strong { color: #2980b9; }
    .explanation-item { margin-bottom: 8px; }
    .btn-finish { display: block; width: 100%; padding: 15px; background-color: #27ae60; color: white; border: none; border-radius: 5px; font-size: 1.2em; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-top: 30px; margin-bottom: 40px; }
    .btn-finish:hover { background-color: #219653; }
    .btn-finish:disabled { background-color: #95a5a6; cursor: not-allowed; }
    #score-section { display: none; margin-top: 40px; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #3498db; text-align: center; }
    #score-section h2 { color: #2c3e50; margin-top: 0; font-size: 2em; }
    .score-display { font-size: 1.5em; font-weight: bold; margin: 20px 0; }
    .correct-ans { background-color: #d4edda !important; border-color: #c3e6cb !important; color: #155724 !important; font-weight: bold; }
    .incorrect-ans { background-color: #f8d7da !important; border-color: #f5c6cb !important; color: #721c24 !important; text-decoration: line-through; }
</style>
</head>
<body>
<h1>Generated Assessment</h1>
<div id="quiz-wrapper"></div>
<button id="finish-btn" class="btn-finish" onclick="finishQuiz()">FINISH QUIZ</button>
<div id="score-section">
    <h2>Assessment Results</h2>
    <div class="score-display" id="final-score"></div>
    <p>Review your answers below. <span style="color: green; font-weight: bold;">Green</span> indicates the correct answer, and <span style="color: red; font-weight: bold; text-decoration: line-through;">Red</span> indicates your incorrect choice.</p>
</div>
<script>
    const quizData = ${JSON.stringify(quizData)};
    const quizWrapper = document.getElementById('quiz-wrapper');
    
    quizData.forEach((item, index) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'quiz-container';
        qDiv.id = 'q-container-' + item.id;
        
        let optionsHTML = '';
        for (const [key, value] of Object.entries(item.options)) {
            optionsHTML += '<li id="opt-' + item.id + '-' + key + '"><label style="display:block; width:100%; cursor:pointer;"><input type="checkbox" name="q' + item.id + '" value="' + key + '"><strong>' + key.toUpperCase() + '.</strong> ' + value + '</label></li>';
        }

        let explanationsHTML = '';
        for (const [key, text] of Object.entries(item.explanations || {})) {
            explanationsHTML += '<div class="explanation-item"><strong>' + key.toUpperCase() + ':</strong> ' + text + '</div>';
        }

        qDiv.innerHTML = '<div class="question">' + (index + 1) + '. ' + item.question + '</div><ul class="options-list">' + optionsHTML + '</ul><div class="explanation-box" id="exp-' + item.id + '">' + explanationsHTML + '</div>';
        quizWrapper.appendChild(qDiv);
    });

    function finishQuiz() {
        let correctCount = 0;
        let answeredCount = 0;

        quizData.forEach(item => {
            const checkboxes = document.querySelectorAll('input[name="q' + item.id + '"]');
            let answered = false;
            let selectedValues = [];

            checkboxes.forEach(cb => {
                if(cb.checked) {
                    answered = true;
                    selectedValues.push(cb.value);
                }
                cb.disabled = true; 
            });

            const container = document.getElementById('q-container-' + item.id);
            const expBox = document.getElementById('exp-' + item.id);
            expBox.style.display = 'block';

            if (answered) {
                answeredCount++;
                const isCorrect = selectedValues.length === item.correctAnswers.length && selectedValues.every(v => item.correctAnswers.includes(v));
                
                item.correctAnswers.forEach(ans => {
                    const correctLi = document.getElementById('opt-' + item.id + '-' + ans);
                    if(correctLi) correctLi.classList.add('correct-ans');
                });

                if (isCorrect) {
                    correctCount++;
                    container.style.borderLeft = "5px solid #27ae60"; 
                } else {
                    container.style.borderLeft = "5px solid #e74c3c"; 
                    selectedValues.forEach(val => {
                        if(!item.correctAnswers.includes(val)) {
                            const selectedLi = document.getElementById('opt-' + item.id + '-' + val);
                            if(selectedLi) selectedLi.classList.add('incorrect-ans');
                        }
                    });
                }
            } else {
                container.style.borderLeft = "5px solid #f39c12"; 
                item.correctAnswers.forEach(ans => {
                    const correctLi = document.getElementById('opt-' + item.id + '-' + ans);
                    if(correctLi) correctLi.classList.add('correct-ans');
                });
            }
        });

        const finishBtn = document.getElementById('finish-btn');
        finishBtn.disabled = true;
        finishBtn.innerText = "Assessment Finished. Review Explanations Below.";

        const scoreSection = document.getElementById('score-section');
        const finalScoreDiv = document.getElementById('final-score');
        
        if(answeredCount === 0) {
             finalScoreDiv.innerHTML = "You didn't answer any questions! <br><span style='color:#e74c3c'>0 / 0</span>";
        } else {
             let percentage = Math.round((correctCount / answeredCount) * 100);
             let color = percentage >= 75 ? '#27ae60' : (percentage >= 50 ? '#f39c12' : '#e74c3c');
             finalScoreDiv.innerHTML = "You scored <span style='color:" + color + "'>" + correctCount + "</span> out of " + answeredCount + " answered questions.<br><span style='font-size:0.8em; color:#7f8c8d;'>(" + percentage + "%)</span>";
        }

        scoreSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>
</body>
</html>`;
};


// --- 3. Advanced Quiz UI (Checkbox Fix) ---
const RenderQuiz = ({ data }) => {
    const [userAnswers, setUserAnswers] = useState({}); 
    const [isFinished, setIsFinished] = useState(false);

    let safeData = Array.isArray(data) ? data : (Object.values(data).find(v => Array.isArray(v)) || []);
    if (!Array.isArray(safeData) || safeData.length === 0) return <p style={{color: '#ef4444'}}>Failed to generate Quiz.</p>;

    const normalizedData = safeData.map((q, idx) => {
        let optsObj = {};
        if (Array.isArray(q.options)) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            q.options.forEach((val, i) => { optsObj[labels[i] || i] = val; });
        } else {
            optsObj = q.options || {};
        }
        
        let corrects = [];
        if (Array.isArray(q.correctAnswers)) corrects = q.correctAnswers.map(c => c.toLowerCase());
        else if (typeof q.correct === 'string') corrects = [q.correct.toLowerCase()];
        else if (typeof q.correctAnswers === 'string') corrects = [q.correctAnswers.toLowerCase()];
        
        let finalCorrectKeys = [];
        for (const [key, val] of Object.entries(optsObj)) {
            if (corrects.includes(key.toLowerCase()) || corrects.includes(val.toLowerCase())) {
                finalCorrectKeys.push(key);
            }
        }

        return {
            id: idx + 1,
            question: q.question,
            options: optsObj,
            correctAnswers: finalCorrectKeys, 
            explanations: q.explanations || {}
        };
    });

    const handleOptionSelect = (qId, optKey) => {
        if (isFinished) return;
        setUserAnswers(prev => {
            const currentSelections = prev[qId] || [];
            if (currentSelections.includes(optKey)) {
                return { ...prev, [qId]: currentSelections.filter(k => k !== optKey) };
            } else {
                return { ...prev, [qId]: [...currentSelections, optKey] };
            }
        });
    };

    const downloadHTML = () => {
        const htmlContent = generateQuizHTML(normalizedData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Interactive_Assessment.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    let correctCount = 0;
    let answeredCount = 0;

    if (isFinished) {
        normalizedData.forEach(q => {
            const selected = userAnswers[q.id] || [];
            if (selected.length > 0) {
                answeredCount++;
                const isCorrect = selected.length === q.correctAnswers.length && selected.every(s => q.correctAnswers.includes(s));
                if (isCorrect) correctCount++;
            }
        });
    }

    return (
        <div className="rendered-content quiz-content" style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ margin: 0, color: '#f8fafc' }}>Assessment ({normalizedData.length} Questions)</h2>
                <button onClick={downloadHTML} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    📥 Download HTML
                </button>
            </div>
            
            {normalizedData.map((q) => {
                const selectedOptions = userAnswers[q.id] || [];
                
                return (
                    <div key={q.id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: isFinished ? (selectedOptions.length > 0 ? (selectedOptions.every(s => q.correctAnswers.includes(s)) && selectedOptions.length === q.correctAnswers.length ? '5px solid #27ae60' : '5px solid #e74c3c') : '5px solid #f39c12') : 'none' }}>
                        <h4 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '1.1em' }}>{q.id}. {q.question}</h4>
                        
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {Object.entries(q.options).map(([optKey, optVal]) => {
                                const isSelected = selectedOptions.includes(optKey);
                                const isActuallyCorrect = q.correctAnswers.includes(optKey);
                                
                                let liStyle = { marginBottom: '10px', padding: '12px', background: '#334155', border: '1px solid #475569', borderRadius: '5px', color: '#f8fafc' };

                                if (isFinished) {
                                    if (isActuallyCorrect) {
                                        liStyle.background = '#14532d'; liStyle.borderColor = '#22c55e'; liStyle.color = '#86efac';
                                    } else if (isSelected && !isActuallyCorrect) {
                                        liStyle.background = '#7f1d1d'; liStyle.borderColor = '#ef4444'; liStyle.textDecoration = 'line-through'; liStyle.color = '#fca5a5';
                                    }
                                } else if (isSelected) {
                                    liStyle.background = '#0369a1'; liStyle.borderColor = '#38bdf8';
                                }

                                return (
                                    <li key={optKey} style={liStyle}>
                                        <label style={{ cursor: isFinished ? 'default' : 'pointer', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected} 
                                                onChange={() => handleOptionSelect(q.id, optKey)} 
                                                disabled={isFinished}
                                                style={{ marginRight: '15px', transform: 'scale(1.2)', cursor: isFinished ? 'default' : 'pointer' }} 
                                            />
                                            <span><strong>{optKey.toUpperCase()}.</strong> {optVal}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>

                        {isFinished && q.explanations && (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#0f172a', borderLeft: '4px solid #3498db', borderRadius: '4px' }}>
                                {Object.entries(q.explanations).map(([expKey, expText]) => (
                                    <div key={expKey} style={{ marginBottom: '8px', fontSize: '0.95em', color: '#cbd5e1' }}>
                                        <strong style={{ color: '#38bdf8' }}>{expKey.toUpperCase()}:</strong> {expText}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            
            <div style={{ marginTop: '30px' }}>
                {!isFinished ? (
                    <button 
                        onClick={() => setIsFinished(true)}
                        style={{ width: '100%', padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        FINISH QUIZ
                    </button>
                ) : (
                    <div style={{ textAlign: 'center', padding: '25px', backgroundColor: '#1e293b', borderRadius: '8px', borderTop: '5px solid #3498db' }}>
                        <h2 style={{ color: '#f8fafc', margin: '0 0 20px 0' }}>Assessment Results</h2>
                        {answeredCount === 0 ? (
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '20px 0' }}>You didn't answer any questions! <br/><span style={{color: '#e74c3c'}}>0 / 0</span></div>
                        ) : (
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '20px 0' }}>
                                You scored <span style={{color: (correctCount/answeredCount)>=0.75?'#27ae60':(correctCount/answeredCount)>=0.5?'#f39c12':'#e74c3c'}}>{correctCount}</span> out of {answeredCount} answered questions.<br/>
                                <span style={{fontSize: '0.8em', color: '#94a3b8'}}>({Math.round((correctCount / answeredCount) * 100)}%)</span>
                            </div>
                        )}
                        <p style={{ color: '#cbd5e1' }}>Review your answers above. <span style={{ color: '#22c55e', fontWeight:'bold' }}>Green</span> indicates correct, <span style={{ color: '#ef4444', fontWeight:'bold', textDecoration:'line-through' }}>Red</span> indicates incorrect.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// ==========================================
// 💡 MAIN COMPONENT
// ==========================================
const StudyPilot = () => {
    const dispatch = useDispatch();
    const [sources, setSources] = useState([]);
    
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [loadingAction, setLoadingAction] = useState(null);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setSources((prev) => [...prev, ...files]);
    };

    const handleGenerate = async (actionType, customPrompt = "") => {
        if (sources.length === 0) {
            alert("Upload at least one PDF source to generate materials.");
            return;
        }

        const isCustomQuiz = customPrompt && (customPrompt.toLowerCase().includes('quiz') || customPrompt.toLowerCase().includes('mcq'));

        if (isCustomQuiz) {
            const numbers = customPrompt.match(/\d+/g);
            if (numbers) {
                const requestedCount = parseInt(numbers[0], 10);
                if (requestedCount < 1 || requestedCount > 50) {
                    setChatHistory(prev => [...prev, { role: 'ai', type: 'error', text: "Custom limit is 1 >= 50. Please request a number between 1 and 50." }]);
                    return;
                }
            }
        }

        let finalPrompt = customPrompt;
        if (!finalPrompt) {
            if (actionType === 'Quiz') {
                finalPrompt = "Generate default amount (5-20) of MCQs.";
            } else if (actionType === 'Summary') {
                finalPrompt = "Generate a deep, highly detailed summary for absolute beginners. Explain concepts and formulas thoroughly.";
            } else {
                finalPrompt = `Please generate a ${actionType} based on the uploaded notes.`;
            }
        }
        
        setChatHistory(prev => [...prev, { role: 'user', text: finalPrompt }]);
        setLoadingAction(actionType || (isCustomQuiz ? 'Quiz' : 'Custom'));
        setChatInput(""); 
        
        const formData = new FormData();
        formData.append('actionType', actionType || (isCustomQuiz ? 'Quiz' : 'Custom'));
        formData.append('chatPrompt', finalPrompt);
        sources.forEach(file => formData.append('outlines', file));

        try {
            const resultAction = await dispatch(generateStudyMaterials(formData)).unwrap();
            
            if (resultAction.success) {
                let responseType = actionType || 'Custom';
                if (isCustomQuiz) responseType = 'Quiz';

                setChatHistory(prev => [...prev, { 
                    role: 'ai', 
                    type: responseType, 
                    data: resultAction.data 
                }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'ai', type: 'error', text: resultAction.message || "An error occurred." }]);
            }
        } catch (error) {
            console.error(`Error generating:`, error);
            const actualErrorMessage = error?.message || "System Error detected. Please try again.";
            setChatHistory(prev => [...prev, { role: 'ai', type: 'error', text: actualErrorMessage }]);
        } finally {
            setLoadingAction(null);
        }
    };

    const renderChatBubble = (msg, index) => {
        if (msg.role === 'user') return <div key={index} className="chat-bubble user-bubble">{msg.text}</div>;
        if (msg.type === 'error') return <div key={index} className="chat-bubble ai-bubble error-bubble">{msg.text}</div>;

        return (
            <div key={index} className="chat-bubble ai-bubble" style={{ width: '100%', maxWidth: '850px' }}>
                {msg.type === 'Summary' && <RenderSummary data={msg.data} />}
                {msg.type === 'Flashcards' && <RenderFlashcards data={msg.data} />}
                {msg.type === 'Quiz' && <RenderQuiz data={msg.data} />}
                {msg.type === 'Mindmap' && <StudyPlanMindMap aiPlanData={msg.data} />}
                {msg.type === 'Custom' && <div style={{whiteSpace: 'pre-wrap', color: '#cbd5e1'}}>{typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}</div>}
            </div>
        );
    };

    return (
        <div className="study-pilot-container">
            <div className="pilot-panel left-panel">
                <div className="panel-header">
                    <h3>Sources</h3>
                    <div className="source-count">{sources.length}</div>
                </div>
                <label className="upload-btn">
                    <span className="material-symbols-outlined">add</span> Add PDF source
                    <input type="file" multiple accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <div className="sources-list">
                    {sources.map((file, idx) => (
                        <div key={idx} className="source-item">📄 {file.name}</div>
                    ))}
                </div>
            </div>

            <div className="pilot-panel middle-panel chat-interface">
                <div className="chat-history">
                    {chatHistory.length === 0 ? (
                        <div className="empty-middle-state">
                            <h2>Welcome to Study Pilot Chat</h2>
                            <p>Upload a source document and select a tool from the Studio, or type your request below!</p>
                        </div>
                    ) : (
                        chatHistory.map((msg, idx) => renderChatBubble(msg, idx))
                    )}
                    {loadingAction && (
                        <div className="chat-bubble ai-bubble loading-bubble">
                            <div className="spinner"></div> generating {loadingAction}...
                        </div>
                    )}
                </div>
                
                <div className="chat-input-area">
                    <input 
                        type="text" 
                        placeholder="Ex: generate 10 quiz..." 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate('Custom', chatInput)} 
                    />
                    <button onClick={() => handleGenerate('Custom', chatInput)}>
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>

            <div className="pilot-panel right-panel">
                <div className="panel-header"><h3>Studio Quick Actions</h3></div>
                <div className="studio-grid">
                    <button className="studio-card" onClick={() => handleGenerate('Summary')} disabled={loadingAction !== null}>Summary</button>
                    <button className="studio-card" onClick={() => handleGenerate('Flashcards')} disabled={loadingAction !== null}>Flashcards</button>
                    <button className="studio-card" onClick={() => handleGenerate('Quiz')} disabled={loadingAction !== null}>Quiz (MCQ)</button>
                    <button className="studio-card" onClick={() => handleGenerate('Mindmap')} disabled={loadingAction !== null}>Knowledge Map</button>
                </div>
            </div>
        </div>
    );
};

export default StudyPilot;