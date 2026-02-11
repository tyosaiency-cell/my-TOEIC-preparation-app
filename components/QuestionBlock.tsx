import React, { useState } from 'react';
import { Question } from '../types';

interface QuestionBlockProps {
    questions: Question[];
    onScoreUpdate?: (score: number) => void;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({ questions, onScoreUpdate }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [showResults, setShowResults] = useState(false);

    const handleSelect = (qId: number, option: string) => {
        // Extract the option letter (e.g., "(A) answer" -> "A")
        // Assuming the option format is "(A) Text" or just "Text", but usually TOEIC is letter based.
        // We will store the full option string or index. Let's store the letter prefix if present.
        const letter = option.match(/^\(([A-D])\)/)?.[1] || option.charAt(0);
        
        setSelectedAnswers(prev => ({ ...prev, [qId]: letter }));
    };

    const checkAnswers = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (selectedAnswers[q.id] === q.answer) {
                correctCount++;
            }
        });
        setShowResults(true);
        if (onScoreUpdate) {
            onScoreUpdate(Math.round((correctCount / questions.length) * 100));
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <h5 className="font-bold text-lg text-gray-700 border-b pb-2">設問 (Questions)</h5>
            {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-semibold text-gray-800 mb-3">{idx + 1}. {q.text}</p>
                    <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                    onChange={() => handleSelect(q.id, opt)}
                                    disabled={showResults}
                                />
                                <span className="text-gray-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                    
                    {showResults && (
                        <div className={`mt-3 p-3 rounded text-sm font-medium ${
                            selectedAnswers[q.id] === q.answer 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {selectedAnswers[q.id] === q.answer ? (
                                <span>✅ 正解！ {q.explanation}</span>
                            ) : (
                                <span>❌ 不正解。正解は {q.answer} です。 {q.explanation}</span>
                            )}
                        </div>
                    )}
                </div>
            ))}
            
            {!showResults && (
                <button
                    onClick={checkAnswers}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow transition duration-200"
                >
                    答え合わせ (Check Answers)
                </button>
            )}
        </div>
    );
};

export default QuestionBlock;