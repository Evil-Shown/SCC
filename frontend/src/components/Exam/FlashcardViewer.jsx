import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FlashcardViewer = ({ flashcardsData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcardsData || !Array.isArray(flashcardsData) || flashcardsData.length === 0) {
        return <div className="p-4 text-center text-gray-500">Flashcards දත්ත නොමැත (No flashcards available)</div>;
    }

    const currentCard = flashcardsData[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcardsData.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcardsData.length) % flashcardsData.length);
        }, 150);
    };

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-700">
                Flashcard {currentIndex + 1} / {flashcardsData.length}
            </h2>
            
            <div 
                className="relative w-full h-80 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    className="w-full h-full preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                >
                    {/* Front of the card */}
                    <div className="absolute w-full h-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 flex items-center justify-center text-center backface-hidden shadow-lg">
                        <h3 className="text-2xl font-bold text-blue-900">{currentCard.front}</h3>
                    </div>

                    {/* Back of the card */}
                    <div 
                        className="absolute w-full h-full bg-green-50 border-2 border-green-200 rounded-2xl p-8 flex items-center justify-center text-center backface-hidden shadow-lg overflow-y-auto"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <p className="text-lg text-green-900 font-medium leading-relaxed">
                            {currentCard.back}
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="flex gap-4 mt-8 w-full justify-center">
                <button 
                    onClick={handlePrev}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                    පෙර (Prev)
                </button>
                <button 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
                >
                    හරවන්න (Flip)
                </button>
                <button 
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                >
                    ඊළඟ (Next)
                </button>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">කාඩ්පත මත ක්ලික් කිරීමෙන්ද හරවා බැලිය හැක.</p>
        </div>
    );
};

export default FlashcardViewer;
