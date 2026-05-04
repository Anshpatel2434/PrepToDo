import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLookupWordMutation } from '../../dictionary/redux_usecase/dictionaryApi';
import { Loader2, Check, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface WordPopupProps {
    word: string;
    passageId?: string;
    sourceContext?: string;
    rect: DOMRect;
    isDark: boolean;
    onClose: () => void;
}

export const WordPopup: React.FC<WordPopupProps> = ({
    word,
    passageId,
    sourceContext,
    rect,
    isDark,
    onClose
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [lookupWord, { isLoading }] = useLookupWordMutation();

    const [status, setStatus] = useState<'checking' | 'idle' | 'result' | 'error' | 'limit_reached' | 'not_found'>('checking');
    const [resultData, setResultData] = useState<{
        word_data?: {
            word: string;
            pronunciation?: string;
            meanings: Array<{ meaning: string; example?: string }>;
            mnemonic?: string;
        };
        message?: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Calculate position
    useEffect(() => {
        if (!popupRef.current) return;
        
        // Wait for next frame so popup height is calculated
        requestAnimationFrame(() => {
            if (!popupRef.current) return;
            
            const popupRect = popupRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Preferred: below the text
            let top = rect.bottom + 10;
            // If it falls off the bottom, put it above
            if (top + popupRect.height > viewportHeight) {
                top = rect.top - popupRect.height - 10;
            }

            // Center horizontally based on the selected word
            let left = rect.left + (rect.width / 2) - (popupRect.width / 2);

            // Clamp to viewport edges
            if (left < 10) left = 10;
            if (left + popupRect.width > viewportWidth - 10) {
                left = viewportWidth - popupRect.width - 10;
            }

            setPosition({ top, left });
        });
    }, [rect, status]); // Recalculate if status changes (size might change)

    // Check cache on mount
    useEffect(() => {
        const checkCache = async () => {
            try {
                const res = await lookupWord({
                    word,
                    passage_id: passageId,
                    source_context: sourceContext,
                    check_only: true
                }).unwrap();

                if (res.cached && res.word_data) {
                    setResultData(res);
                    setStatus('result');
                } else {
                    setStatus('idle');
                }
            } catch (err) {
                setStatus('idle');
            }
        };
        checkCache();
    }, [word, passageId, sourceContext, lookupWord]);

    const handleAddWord = async () => {
        try {
            const res = await lookupWord({
                word,
                passage_id: passageId,
                source_context: sourceContext
            }).unwrap();

            if (res.limit_reached) {
                setStatus('limit_reached');
                setErrorMessage(res.message || "Limit reached.");
            } else if (res.not_found) {
                setStatus('not_found');
                setErrorMessage(res.message || "Word not recognized.");
            } else {
                setResultData(res);
                setStatus('result');
                if (res.cached) {
                    toast.success('Added from dictionary cache!');
                } else {
                    toast.success('Word defined and added!');
                }
            }
        } catch (err: unknown) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Failed to lookup word');
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Escape to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                ref={popupRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    top: position.top,
                    left: position.left,
                    zIndex: 50, // ensures it sits above passage text
                }}
                className={`
                    w-72 md:w-80 rounded-xl shadow-xl border overflow-hidden flex flex-col
                    backdrop-blur-md
                    ${isDark 
                        ? "bg-bg-primary-dark/90 border-border-dark text-text-primary-dark shadow-black/50" 
                        : "bg-bg-primary-light/95 border-border-light text-text-primary-light shadow-brand-primary-light/10"
                    }
                `}
            >
                {/* Header */}
                <div className={`
                    px-4 py-2 flex justify-between items-center border-b
                    ${isDark ? "border-border-dark bg-bg-secondary-dark/50" : "border-border-light bg-bg-secondary-light/50"}
                `}>
                    <div className="flex items-center space-x-2">
                        <BookOpen size={14} className={isDark ? "text-brand-primary-dark" : "text-brand-primary-light"} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Dictionary</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className={`p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {status === 'checking' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <Loader2 size={24} className={`animate-spin ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                            <p className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Checking dictionary...
                            </p>
                        </div>
                    )}

                    {status === 'idle' && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3">
                            <p className={`font-serif text-lg font-bold capitalize`}>{word}</p>
                            <p className={`text-sm text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Add this word to your personal dictionary?
                            </p>
                            <button
                                onClick={handleAddWord}
                                className={`
                                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                                    ${isDark 
                                        ? "bg-brand-primary-dark text-white hover:bg-brand-primary-dark/90" 
                                        : "bg-brand-primary-light text-white hover:bg-brand-primary-light/90"
                                    }
                                `}
                            >
                                <BookOpen size={16} />
                                <span>Add to Dictionary</span>
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <Loader2 size={24} className={`animate-spin ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                            <p className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Decoding "{word}"...
                            </p>
                        </div>
                    )}

                    {status === 'result' && resultData && resultData.word_data && (
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-serif text-lg font-bold capitalize">
                                    {resultData.word_data.word}
                                </h3>
                                {resultData.word_data.pronunciation && (
                                    <p className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                        {resultData.word_data.pronunciation}
                                    </p>
                                )}
                            </div>
                            
                            {resultData.word_data.meanings && resultData.word_data.meanings[0] && (
                                <div className="text-sm">
                                    <p className="font-medium">
                                        1. {resultData.word_data.meanings[0].meaning}
                                    </p>
                                    {resultData.word_data.meanings[0].example && (
                                        <p className={`mt-1 italic ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                            "{resultData.word_data.meanings[0].example}"
                                        </p>
                                    )}
                                </div>
                            )}

                            {resultData.word_data.mnemonic && (
                                <div className={`
                                    p-2 rounded text-xs
                                    ${isDark ? "bg-bg-tertiary-dark text-text-primary-dark" : "bg-bg-tertiary-light text-text-primary-light"}
                                `}>
                                    <span className="font-semibold">🧠 Sound-Alike: </span>
                                    {resultData.word_data.mnemonic}
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-center space-x-2 text-xs font-medium text-green-500">
                                <Check size={14} />
                                <span>Saved to Dictionary</span>
                            </div>
                        </div>
                    )}

                    {(status === 'error' || status === 'not_found') && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
                            <p className="text-sm font-medium text-red-500">{errorMessage}</p>
                            <button 
                                onClick={onClose}
                                className={`
                                    px-3 py-1.5 text-xs rounded-md transition-colors
                                    ${isDark ? "bg-bg-tertiary-dark hover:bg-border-dark" : "bg-bg-tertiary-light hover:bg-border-light"}
                                `}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {status === 'limit_reached' && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
                            <p className="text-sm font-medium">{errorMessage}</p>
                            <button 
                                onClick={onClose}
                                className={`
                                    px-3 py-1.5 text-xs rounded-md transition-colors
                                    ${isDark ? "bg-bg-tertiary-dark hover:bg-border-dark" : "bg-bg-tertiary-light hover:bg-border-light"}
                                `}
                            >
                                Okay
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
