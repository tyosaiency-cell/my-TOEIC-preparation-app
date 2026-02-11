import React, { useState, useCallback, useEffect } from 'react';
import { PartType, ReadingData, ListeningData, WritingData, MockData, VocabularyItem } from './types';
import * as Gemini from './services/geminiService';
import InteractiveText from './components/InteractiveText';
import QuestionBlock from './components/QuestionBlock';
import WordModal from './components/WordModal';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PartType>(PartType.READING);
    const [loading, setLoading] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    // Content State
    const [readingData, setReadingData] = useState<ReadingData | null>(null);
    const [listeningData, setListeningData] = useState<ListeningData | null>(null);
    const [writingData, setWritingData] = useState<WritingData | null>(null);
    const [mockData, setMockData] = useState<MockData | null>(null);
    const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);

    // UI Toggles
    const [showTranslation, setShowTranslation] = useState(false);
    const [writingInput, setWritingInput] = useState("");
    const [writingFeedback, setWritingFeedback] = useState("");
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    // Voice Settings State
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [maleVoiceName, setMaleVoiceName] = useState<string>("");
    const [femaleVoiceName, setFemaleVoiceName] = useState<string>("");

    // --- Load Voices ---
    useEffect(() => {
        const updateVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();
            // Filter for English voices generally
            const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
            setAvailableVoices(enVoices);

            if (enVoices.length > 0) {
                // Heuristic defaults
                setMaleVoiceName(prev => {
                    if (prev && enVoices.some(v => v.name === prev)) return prev;
                    const male = enVoices.find(v => v.name.includes('Male') || v.name.includes('David')) || enVoices[0];
                    return male.name;
                });
                
                setFemaleVoiceName(prev => {
                    if (prev && enVoices.some(v => v.name === prev)) return prev;
                    const female = enVoices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')) 
                        || enVoices.find(v => v.name !== (enVoices.find(v => v.name.includes('Male'))?.name)) 
                        || enVoices[0];
                    return female ? female.name : enVoices[0].name;
                });
            }
        };

        window.speechSynthesis.onvoiceschanged = updateVoices;
        updateVoices();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // --- Load Vocab when tab changes ---
    useEffect(() => {
        if (activeTab === PartType.VOCAB) {
            const history = JSON.parse(localStorage.getItem('vocab_history') || '[]');
            setVocabList(history);
        }
    }, [activeTab]);

    // --- Actions ---

    const handleGenerate = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case PartType.READING:
                    setReadingData(await Gemini.generateReading());
                    setShowTranslation(false);
                    break;
                case PartType.LISTENING:
                    setListeningData(await Gemini.generateListening());
                    break;
                case PartType.WRITING:
                    setWritingData(await Gemini.generateWriting());
                    setWritingInput("");
                    setWritingFeedback("");
                    break;
                case PartType.MOCK:
                    setMockData(await Gemini.generateMock());
                    break;
                case PartType.VOCAB:
                    // No generation needed for vocab
                    break;
            }
        } catch (error) {
            alert("エラーが発生しました。もう一度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    const handleWordClick = (word: string) => {
        // Clean word
        const cleaned = word.replace(/[^a-zA-Z]/g, "");
        if (cleaned.length > 2) setSelectedWord(cleaned);
    };

    const handleDeleteVocab = (wordToDelete: string) => {
        if(confirm("この単語を削除しますか？")) {
            const newList = vocabList.filter(item => item.word !== wordToDelete);
            setVocabList(newList);
            localStorage.setItem('vocab_history', JSON.stringify(newList));
        }
    };

    // --- Listening Audio Logic ---
    const playAudio = useCallback(() => {
        if (!listeningData || isAudioPlaying) return;
        
        setIsAudioPlaying(true);
        const synth = window.speechSynthesis;
        const utterances: SpeechSynthesisUtterance[] = [];
        const voices = synth.getVoices(); // Get latest reference for playback

        listeningData.script.forEach(line => {
            const u = new SpeechSynthesisUtterance(line.text);
            u.lang = 'en-US';
            u.rate = 1.0;
            
            // Assign selected voices
            const targetName = line.speaker === 'Man' ? maleVoiceName : femaleVoiceName;
            const voice = voices.find(v => v.name === targetName);
            if (voice) u.voice = voice;
            
            utterances.push(u);
        });

        // Chain execution
        let idx = 0;
        const speakNext = () => {
            if (idx < utterances.length) {
                const u = utterances[idx];
                u.onend = () => {
                    idx++;
                    speakNext();
                };
                synth.speak(u);
            } else {
                setIsAudioPlaying(false);
            }
        };

        if(utterances.length > 0) speakNext();
    }, [listeningData, isAudioPlaying, maleVoiceName, femaleVoiceName]);

    const stopAudio = () => {
        window.speechSynthesis.cancel();
        setIsAudioPlaying(false);
    };

    // --- Writing Logic ---
    const submitWriting = async () => {
        if(!writingInput.trim()) return;
        setLoading(true);
        try {
            const feedback = await Gemini.correctWriting(writingInput);
            setWritingFeedback(feedback);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---

    const renderTabButton = (type: PartType, label: string, icon: string) => (
        <button
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-3 px-2 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2
                ${activeTab === type ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
            <i className={`bi ${icon}`}></i>
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen pb-20">
            {/* Navbar */}
            <nav className="bg-blue-700 text-white shadow-lg mb-8">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
                    <span className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        TOEIC AI Trainer Pro
                    </span>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-200 rounded-xl">
                    {renderTabButton(PartType.READING, 'リーディング', 'bi-book')}
                    {renderTabButton(PartType.LISTENING, 'リスニング', 'bi-headphones')}
                    {renderTabButton(PartType.WRITING, 'ライティング', 'bi-pen')}
                    {renderTabButton(PartType.MOCK, '模擬試験', 'bi-stopwatch')}
                    {renderTabButton(PartType.VOCAB, 'My 単語帳', 'bi-journal-bookmark')}
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[400px]">
                    
                    {/* Header with Generate Button */}
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === PartType.READING && "Part 7 リーディング練習"}
                            {activeTab === PartType.LISTENING && "Part 3 リスニング練習"}
                            {activeTab === PartType.WRITING && "Writing 練習"}
                            {activeTab === PartType.MOCK && "Part 7 ダブルパッセージ模試"}
                            {activeTab === PartType.VOCAB && "My 単語帳 (Vocabulary)"}
                        </h2>
                        {activeTab !== PartType.VOCAB && (
                            <button 
                                onClick={handleGenerate} 
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>生成中...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        <span>新しい問題</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Content Logic */}
                    
                    {/* --- READING --- */}
                    {activeTab === PartType.READING && (
                        <>
                            {!readingData ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4">📖</p>
                                    <p>「新しい問題」ボタンを押して始めましょう</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <h3 className="text-xl font-bold mb-4">{readingData.title}</h3>
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4">
                                        <InteractiveText 
                                            text={readingData.content} 
                                            onWordClick={handleWordClick}
                                            className="text-lg leading-loose"
                                        />
                                    </div>
                                    
                                    <button 
                                        onClick={() => setShowTranslation(!showTranslation)}
                                        className="text-blue-600 text-sm font-semibold hover:underline mb-4"
                                    >
                                        {showTranslation ? "翻訳を隠す" : "翻訳を表示"}
                                    </button>
                                    
                                    {showTranslation && (
                                        <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 mb-6 text-sm leading-relaxed">
                                            {readingData.translation}
                                        </div>
                                    )}

                                    <QuestionBlock 
                                        questions={readingData.questions} 
                                        onScoreUpdate={(score) => alert(`スコア: ${score}/100`)} 
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* --- LISTENING --- */}
                    {activeTab === PartType.LISTENING && (
                        <>
                            {!listeningData ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4">🎧</p>
                                    <p>「新しい問題」ボタンを押して始めましょう</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="bg-blue-50 rounded-xl p-8 text-center mb-6">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Topic: {listeningData.topic}</h3>
                                        <div className="flex justify-center gap-4 mb-6">
                                            <button 
                                                onClick={playAudio} 
                                                disabled={isAudioPlaying}
                                                className={`px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2
                                                    ${isAudioPlaying ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                            >
                                                <span>▶</span> 再生 (TTS)
                                            </button>
                                            <button 
                                                onClick={stopAudio}
                                                className="bg-red-100 text-red-600 hover:bg-red-200 px-6 py-3 rounded-full font-bold shadow transition"
                                            >
                                                ■ 停止
                                            </button>
                                        </div>

                                        {/* Voice Settings */}
                                        <div className="bg-white/50 rounded-lg p-4 border border-blue-100 text-left">
                                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 border-b border-blue-200 pb-1">音声設定 (Voice Settings)</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-600 block mb-1 font-medium">男性 (Man)</label>
                                                    <select 
                                                        value={maleVoiceName}
                                                        onChange={(e) => setMaleVoiceName(e.target.value)}
                                                        className="w-full text-sm border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    >
                                                        {availableVoices.length === 0 && <option>音声を読み込み中...</option>}
                                                        {availableVoices.map(v => (
                                                            <option key={v.name} value={v.name}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600 block mb-1 font-medium">女性 (Woman)</label>
                                                    <select 
                                                        value={femaleVoiceName}
                                                        onChange={(e) => setFemaleVoiceName(e.target.value)}
                                                        className="w-full text-sm border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    >
                                                        {availableVoices.length === 0 && <option>音声を読み込み中...</option>}
                                                        {availableVoices.map(v => (
                                                            <option key={v.name} value={v.name}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <details className="group">
                                            <summary className="list-none flex justify-between items-center font-medium cursor-pointer text-gray-500 hover:text-blue-600">
                                                <span>スクリプトを表示</span>
                                                <span className="transition group-open:rotate-180">
                                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                                </span>
                                            </summary>
                                            <div className="text-gray-600 mt-4 bg-gray-50 p-4 rounded border max-h-60 overflow-y-auto">
                                                {listeningData.script.map((line, i) => (
                                                    <div key={i} className="mb-2">
                                                        <span className={`font-bold mr-2 ${line.speaker === 'Man' ? 'text-blue-600' : 'text-pink-600'}`}>{line.speaker}:</span>
                                                        <span>{line.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>

                                    <QuestionBlock 
                                        questions={listeningData.questions} 
                                        onScoreUpdate={(score) => alert(`スコア: ${score}/100`)}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* --- WRITING --- */}
                    {activeTab === PartType.WRITING && (
                        <>
                            {!writingData ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4">✍️</p>
                                    <p>「新しい問題」ボタンを押して始めましょう</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                        <p className="font-bold text-yellow-800">Topic:</p>
                                        <p className="text-lg text-gray-800 mb-2">{writingData.prompt}</p>
                                        <p className="text-sm text-gray-500">💡 {writingData.suggestion}</p>
                                    </div>

                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-48 mb-4"
                                        placeholder="ここに回答を入力してください..."
                                        value={writingInput}
                                        onChange={(e) => setWritingInput(e.target.value)}
                                    ></textarea>

                                    <button
                                        onClick={submitWriting}
                                        disabled={loading || !writingInput}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow disabled:opacity-50"
                                    >
                                        {loading ? "添削中..." : "添削を依頼する"}
                                    </button>

                                    {writingFeedback && (
                                        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                            <h4 className="font-bold text-lg mb-4 text-purple-700">AI添削結果</h4>
                                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                                {writingFeedback}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* --- MOCK --- */}
                    {activeTab === PartType.MOCK && (
                        <>
                             {!mockData ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4">⏱️</p>
                                    <p>「新しい問題」ボタンを押して始めましょう</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="bg-gray-50 p-4 rounded border">
                                            <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">{mockData.p1_title}</h4>
                                            <InteractiveText text={mockData.p1_content} onWordClick={handleWordClick} className="text-sm" />
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded border">
                                            <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">{mockData.p2_title}</h4>
                                            <InteractiveText text={mockData.p2_content} onWordClick={handleWordClick} className="text-sm" />
                                        </div>
                                    </div>

                                    <QuestionBlock 
                                        questions={mockData.questions} 
                                        onScoreUpdate={(score) => alert(`スコア: ${score}/100`)}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* --- VOCABULARY --- */}
                    {activeTab === PartType.VOCAB && (
                        <div className="animate-fade-in">
                            {vocabList.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4">📇</p>
                                    <p>まだ保存された単語はありません。</p>
                                    <p className="text-sm mt-2">リーディングや模試の単語をクリックして保存しましょう。</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {vocabList.map((item, idx) => (
                                        <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition relative">
                                            <button 
                                                onClick={() => handleDeleteVocab(item.word)}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                                                title="削除"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                            <h4 className="text-xl font-bold text-blue-800 mb-1">{item.word}</h4>
                                            <span className="inline-block bg-gray-100 text-xs px-2 py-1 rounded text-gray-600 mb-3">
                                                {item.definition?.partOfSpeech || 'N/A'}
                                            </span>
                                            
                                            <div className="mb-3">
                                                <p className="font-bold text-gray-700 text-sm">意味:</p>
                                                <p className="text-gray-800">{item.definition?.meaning}</p>
                                            </div>
                                            
                                            <div className="bg-blue-50 p-3 rounded text-sm">
                                                <p className="italic text-gray-600 mb-1">"{item.definition?.example}"</p>
                                                <p className="text-gray-500 text-xs">{item.definition?.exampleTranslation}</p>
                                            </div>
                                            
                                            <div className="mt-3 pt-3 border-t text-xs text-gray-400 text-right">
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Word Definition Modal */}
            <WordModal word={selectedWord} onClose={() => setSelectedWord(null)} />
        </div>
    );
};

export default App;