import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReadingData, ListeningData, WritingData, MockData, WordDefinition } from "../types";

// Using the recommended model for text tasks
const MODEL_NAME = 'gemini-3-flash-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generic helper to fetch JSON from Gemini
async function fetchJson<T>(prompt: string, schema: Schema): Promise<T> {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are an expert TOEIC exam creator. Output strict JSON. Ensure all explanations and translations are in natural, business-level Japanese."
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as T;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

export const generateReading = async (): Promise<ReadingData> => {
    const prompt = `
    Generate a TOEIC Part 7 Reading Comprehension exercise.
    1. Create a business article or email (approx 200 words).
    2. Provide a Japanese translation.
    3. Create 2 multiple-choice questions.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            translation: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING, description: "The correct option letter, e.g., 'A'" },
                        explanation: { type: Type.STRING, description: "Explanation in Japanese" }
                    },
                    required: ["id", "text", "options", "answer", "explanation"]
                }
            }
        },
        required: ["title", "content", "translation", "questions"]
    };

    return fetchJson<ReadingData>(prompt, schema);
};

export const generateListening = async (): Promise<ListeningData> => {
    const prompt = `
    Generate a TOEIC Part 3 Listening exercise.
    1. Create a dialogue between a Man and a Woman (approx 150 words).
    2. Create 3 questions.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING },
            script: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        speaker: { type: Type.STRING, enum: ["Man", "Woman"] },
                        text: { type: Type.STRING }
                    },
                    required: ["speaker", "text"]
                }
            },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING, description: "Explanation in Japanese" }
                    },
                    required: ["id", "text", "options", "answer", "explanation"]
                }
            }
        },
        required: ["topic", "script", "questions"]
    };

    return fetchJson<ListeningData>(prompt, schema);
};

export const generateWriting = async (): Promise<WritingData> => {
    const prompt = `
    Generate a TOEIC Part 8 (Essay) Writing prompt.
    Include a suggestion/tip in Japanese on how to answer.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING },
            suggestion: { type: Type.STRING, description: "Tip in Japanese" }
        },
        required: ["prompt", "suggestion"]
    };

    return fetchJson<WritingData>(prompt, schema);
};

export const generateMock = async (): Promise<MockData> => {
    const prompt = `
    Generate a TOEIC Part 7 Double Passage Mock Exam.
    Passage 1: Email. Passage 2: Response or Table.
    Create 3 questions connecting both passages.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            p1_title: { type: Type.STRING },
            p1_content: { type: Type.STRING },
            p2_title: { type: Type.STRING },
            p2_content: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING, description: "Explanation in Japanese" }
                    },
                    required: ["id", "text", "options", "answer", "explanation"]
                }
            }
        },
        required: ["p1_title", "p1_content", "p2_title", "p2_content", "questions"]
    };

    return fetchJson<MockData>(prompt, schema);
};

export const explainWord = async (word: string): Promise<WordDefinition> => {
    const prompt = `
    Explain the word "${word}" in a business English context for a Japanese learner.
    1. Meaning in Japanese.
    2. Part of speech.
    3. English example sentence with Japanese translation.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            meaning: { type: Type.STRING, description: "Japanese meaning" },
            partOfSpeech: { type: Type.STRING, description: "e.g., n., v., adj." },
            example: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING, description: "Japanese translation of example" }
        },
        required: ["meaning", "partOfSpeech", "example", "exampleTranslation"]
    };

    return fetchJson<WordDefinition>(prompt, schema);
};

export const correctWriting = async (text: string): Promise<string> => {
    const prompt = `
    Check this TOEIC essay draft. Provide corrections, a score estimate (0-200 scale based on standard TOEIC Writing scoring), and advice in Japanese.
    Essay: "${text}"
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
    });

    return response.text || "No response generated.";
};