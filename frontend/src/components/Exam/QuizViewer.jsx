import React, { useState } from 'react';
import { motion } from 'framer-motion';

const QuizViewer = ({ quizData }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
        return <div className="p-4 text-center text-gray-500">ප්‍රශ්න පත්‍ර දත්ත නොමැත (No quiz data available)</div>;
    }

    const question = quizData[currentQuestion];
    const isMultipleAnswer = question.correctAnswers && question.correctAnswers.length > 1;

    const handleOptionSelect = (key) => {
        if (showExplanation) return; // දැනටමත් උත්තර දී ඇත්නම් වෙනස් කළ නොහැක
        if (isMultipleAnswer) {
            setSelectedOptions(prev => 
                prev.includes(key) ? prev.filter(o => o !== key) : [...prev, key]
            );
        } else {
            setSelectedOptions([key]);
        }
    };

    const handleSubmit = () => {
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOptions([]);
            setShowExplanation(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto my-4">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
                ප්‍රශ්න අංක {currentQuestion + 1} / {quizData.length}
            </h2>
            <div className="mb-6 text-lg font-medium text-gray-800">
                {question.question}
                {isMultipleAnswer && <span className="ml-2 text-sm text-blue-500">(නිවැරදි පිළිතුරු කිහිපයක් තෝරන්න)</span>}
            </div>

            <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => {
                    const isSelected = selectedOptions.includes(key);
                    const isCorrect = question.correctAnswers.includes(key);
                    
                    let bgClass = "bg-gray-50 border-gray-200 hover:bg-gray-100";
                    if (isSelected) bgClass = "bg-blue-50 border-blue-500";
                    if (showExplanation) {
                        if (isCorrect) bgClass = "bg-green-100 border-green-500 text-green-800";
                        else if (isSelected && !isCorrect) bgClass = "bg-red-100 border-red-500 text-red-800";
                    }

                    return (
                        <div key={key} className="flex flex-col">
                            <button
                                onClick={() => handleOptionSelect(key)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${bgClass}`}
                                disabled={showExplanation}
                            >
                                <span className="font-bold mr-2">{key}:</span> {value}
                            </button>
                            {showExplanation && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    className="ml-4 mt-2 text-sm text-gray-600"
                                >
                                    {question.explanations[key]}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-between">
                {!showExplanation ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOptions.length === 0}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                        පිළිතුරු පරීක්ෂා කරන්න (Check)
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={currentQuestion === quizData.length - 1}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                    >
                        ඊළඟ ප්‍රශ්නය (Next)
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizViewer;
