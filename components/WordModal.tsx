import React, { useEffect, useState } from 'react';
import { explainWord } from '../services/geminiService';
import { WordDefinition, VocabularyItem } from '../types';

interface WordModalProps {
    word: string | null;
    onClose: () => void;
}

const WordModal: React.FC<WordModalProps> = ({ word, onClose }) => {
    const [definition, setDefinition] = useState<WordDefinition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (word) {
            setLoading(true);
            setDefinition(null);
            setError(null);
            explainWord(word)
                .then(data => {
                    setDefinition(data);
                    
                    // Save to local storage with full definition
                    const newItem: VocabularyItem = {
                        word: word,
                        definition: data,
                        date: new Date().toISOString()
                    };

                    const history: VocabularyItem[] = JSON.parse(localStorage.getItem('vocab_history') || '[]');
                    // Avoid duplicates
                    if (!history.some(item => item.word.toLowerCase() === word.toLowerCase())) {
                        history.unshift(newItem); // Add to top
                        localStorage.setItem('vocab_history', JSON.stringify(history));
                    }
                })
                .catch(err => setError("定義を取得できませんでした。"))
                .finally(() => setLoading(false));
        }
    }, [word]);

    if (!word) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="bg-yellow-400 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-gray-900">{word}</span>
                        {!loading && !error && (
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                <span className="mr-1">✓</span> 保存済み
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-800 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 min-h-[150px]">
                    {loading && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                            <p className="text-gray-500 text-sm">AIが検索中...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-center py-4">{error}</div>
                    )}

                    {definition && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-1">意味</h4>
                                <p className="text-lg text-gray-900 font-medium">{definition.meaning}</p>
                            </div>
                            <div>
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-1">品詞</h4>
                                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{definition.partOfSpeech}</span>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h4 className="text-xs uppercase tracking-wide text-blue-500 font-bold mb-1">例文</h4>
                                <p className="text-gray-800 italic mb-1">"{definition.example}"</p>
                                <p className="text-gray-600 text-sm">{definition.exampleTranslation}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordModal;