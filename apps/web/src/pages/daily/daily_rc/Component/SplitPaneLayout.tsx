import React, { useRef, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { WordPopup } from "../../components/WordPopup";

interface SplitPaneLayoutProps {
    isDark: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passage: any | null;
    children: React.ReactNode;
    showPassage: boolean;
    isExamMode: boolean;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
    isDark,
    passage,
    children,
    showPassage,
    isExamMode,
}) => {
    const passageRef = useRef<HTMLDivElement>(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    const [selectedWord, setSelectedWord] = useState<{
        word: string;
        rect: DOMRect;
        sourceContext: string;
    } | null>(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle double click for dictionary lookup (Solution mode only)
    const handleWordDoubleClick = useCallback(() => {
        if (isExamMode) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const word = selection.toString().trim();
        
        // Simple validation to ensure it's a single word without spaces and only alphabets/hyphens
        if (!word || word.includes(' ') || !/^[A-Za-z-]+$/.test(word)) {
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Try to get surrounding context (the sentence)
        let sourceContext = '';
        if (selection.anchorNode && selection.anchorNode.textContent) {
            const fullText = selection.anchorNode.textContent;
            // Extremely simple sentence extraction around the selected offset
            const offset = selection.anchorOffset;
            const start = fullText.lastIndexOf('.', offset) + 1;
            const end = fullText.indexOf('.', offset);
            sourceContext = fullText.slice(
                start > 0 ? start : 0, 
                end > -1 ? end + 1 : fullText.length
            ).trim();
        }

        setSelectedWord({ word, rect, sourceContext });
    }, [isExamMode]);

    const isMobile = windowWidth < 768;


    return (
        <div className="h-full flex flex-col md:flex-row">
            {/* Left Pane - Passage */}
            <motion.div
                className={`
                    overflow-hidden flex flex-col border-b-2 md:border-b-0 md:border-r-2
                    ${isDark ? "border-border-dark" : "border-border-light"}
                    transition-all duration-300 ease-in-out
                `}
                animate={{
                    width: showPassage ? (isMobile ? "100%" : "50%") : "0%",
                    height: showPassage ? (isMobile ? "50%" : "100%") : "0%",
                }}
            >
                <div
                    className={`
                    h-full flex flex-col
                    ${isDark
                            ? "bg-bg-secondary-dark"
                            : "bg-bg-secondary-light"
                        }
                `}
                >
                    {/* Passage Header */}
                    {!isExamMode &&
                        (<div
                            className={`
                        shrink-0 p-4 border-b
                        ${isDark ? "border-border-dark" : "border-border-light"}
                    `}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2
                                        className={`
                                    font-serif font-semibold text-lg
                                    ${isDark
                                                ? "text-text-primary-dark"
                                                : "text-text-primary-light"
                                            }
                                `}
                                    >
                                        {passage?.title || "Passage"}
                                    </h2>
                                    <p
                                        className={`
                                    text-xs mt-1
                                    ${isDark
                                                ? "text-text-muted-dark"
                                                : "text-text-muted-light"
                                            }
                                `}
                                    >
                                        {passage?.genre && `${passage.genre} • `}
                                        {passage?.content &&
                                            `${passage.content.split(/\s+/).length} words`}
                                    </p>
                                </div>
                                <span
                                    className={`
                                px-2 py-1 rounded text-xs font-medium uppercase
                                ${isDark
                                            ? "bg-brand-primary-dark/30 text-brand-primary-dark"
                                            : "bg-brand-primary-light/20 text-brand-primary-light"
                                        }
                            `}
                                >
                                    {isExamMode ? "Exam Mode" : "Solution Mode"}
                                </span>
                            </div>
                            
                            {/* Dictionary Instruction Banner */}
                            {!isExamMode && (
                                <div className={`
                                    mt-3 px-3 py-2 rounded-md flex items-start space-x-2 text-sm
                                    ${isDark ? "bg-brand-primary-dark/10 text-brand-primary-dark" : "bg-brand-primary-light/10 text-brand-primary-light"}
                                `}>
                                    <Info size={16} className="mt-0.5 shrink-0" />
                                    <p>
                                        <strong>Dictionary Active:</strong> Double-click any word in the passage below to instantly view its meaning, synonyms, and memory tricks!
                                    </p>
                                </div>
                            )}
                        </div>)}

                    {/* Passage Content */}
                    <div
                        ref={passageRef}
                        className={`
                            flex-1 overflow-y-auto p-6 prose max-w-none
                            ${isExamMode ? "select-none" : ""}
                            ${isDark
                                ? "prose-invert prose-slate text-text-secondary-dark scrollbar-dark"
                                : "prose-slate text-text-secondary-light scrollbar-light"
                            }
                        `}
                        onDoubleClick={handleWordDoubleClick}
                        onCopy={(e) => {
                            if (isExamMode) {
                                e.preventDefault();
                            }
                        }}
                    >
                        {passage?.content ? (
                            <div
                                className={`
                                    font-serif leading-loose text-lg whitespace-pre-line
                                    ${isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                    }
                                `}
                                dangerouslySetInnerHTML={{ __html: passage.content }}
                            />
                        ) : (
                            <div
                                className={`
                                flex items-center justify-center h-full
                                ${isDark
                                        ? "text-text-muted-dark"
                                        : "text-text-muted-light"
                                    }
                            `}
                            >
                                <p>No passage available</p>
                            </div>
                        )}
                    </div>

                    {/* Copy Protection Notice (Exam Mode) */}
                    {isExamMode && (
                        <div
                            className={`
                            shrink-0 px-4 py-2 text-center text-xs
                            ${isDark
                                    ? "bg-bg-tertiary-dark text-text-muted-dark"
                                    : "bg-bg-tertiary-light text-text-muted-light"
                                }
                        `}
                        >
                            Text selection is disabled during the exam
                        </div>
                    )}
                    
                    {/* Word Popup Container */}
                    {selectedWord && (
                        <WordPopup
                            word={selectedWord.word}
                            rect={selectedWord.rect}
                            sourceContext={selectedWord.sourceContext}
                            passageId={passage?.id}
                            isDark={isDark}
                            onClose={() => setSelectedWord(null)}
                        />
                    )}
                </div>
            </motion.div>

            {/* Right Pane - Question */}
            <motion.div
                className={`
                    flex flex-col
                    transition-all duration-300 ease-in-out
                `}
                animate={{
                    width: showPassage ? (isMobile ? "100%" : "50%") : "100%",
                    height: showPassage ? (isMobile ? "50%" : "100%") : "100%",
                }}
            >
                <div
                    className={`
                    h-full flex flex-col
                    ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
                `}
                >
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default SplitPaneLayout;
