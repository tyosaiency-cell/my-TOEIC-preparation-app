export enum PartType {
    READING = 'reading',
    LISTENING = 'listening',
    WRITING = 'writing',
    MOCK = 'mock',
    VOCAB = 'vocab'
}

export interface Question {
    id: number;
    text: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface ReadingData {
    title: string;
    content: string;
    translation: string;
    questions: Question[];
}

export interface ScriptLine {
    speaker: string;
    text: string;
}

export interface ListeningData {
    topic: string;
    script: ScriptLine[];
    questions: Question[];
}

export interface WritingData {
    prompt: string;
    suggestion: string;
}

export interface MockData {
    p1_title: string;
    p1_content: string;
    p2_title: string;
    p2_content: string;
    questions: Question[];
}

export interface WordDefinition {
    meaning: string;
    partOfSpeech: string;
    example: string;
    exampleTranslation: string;
}

export interface VocabularyItem {
    word: string;
    definition: WordDefinition;
    date: string;
}