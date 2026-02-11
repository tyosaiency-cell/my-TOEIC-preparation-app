import React from 'react';

interface InteractiveTextProps {
    text: string;
    onWordClick: (word: string) => void;
    className?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, onWordClick, className = '' }) => {
    // Split by spaces but keep delimiters to reconstruct flow naturaly if needed,
    // or just split by words for simple clickability.
    // Here we split by non-word characters to isolate words.
    const words = text.split(/(\s+|[.,!?;:()])/);

    return (
        <div className={`font-serif leading-relaxed text-gray-800 ${className}`}>
            {words.map((chunk, idx) => {
                // If chunk is a word (3+ letters), make it clickable
                if (/^[a-zA-Z]{2,}$/.test(chunk)) {
                    return (
                        <span
                            key={idx}
                            onClick={() => onWordClick(chunk)}
                            className="cursor-pointer border-b border-dotted border-gray-400 hover:bg-yellow-100 hover:border-yellow-500 hover:text-black transition-colors duration-200"
                        >
                            {chunk}
                        </span>
                    );
                }
                // Return punctuation/spaces as is
                return <span key={idx}>{chunk}</span>;
            })}
        </div>
    );
};

export default InteractiveText;