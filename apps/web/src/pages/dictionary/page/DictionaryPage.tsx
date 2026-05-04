import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetDictionaryQuery, useRemoveWordMutation } from '../redux_usecase/dictionaryApi';
import { Search, SortAsc, SortDesc, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const DictionaryPage: React.FC = () => {
    const { isDark } = useTheme();
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'date' | 'alphabetical'>('date');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

    const { data: words, isLoading, isFetching } = useGetDictionaryQuery({
        search: search.length > 2 ? search : undefined, // only search if > 2 chars
        sort,
        order
    });

    const [removeWord] = useRemoveWordMutation();

    const handleRemove = async (e: React.MouseEvent, wordId: string, word: string) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to remove "${word}" from your dictionary?`)) {
            try {
                await removeWord(wordId).unwrap();
                toast.success('Word removed');
            } catch {
                toast.error('Failed to remove word');
            }
        }
    };

    const toggleSort = (newSort: 'date' | 'alphabetical') => {
        if (sort === newSort) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(newSort);
            setOrder('desc'); // Default to newest/Z-A first when switching
        }
    };

    return (
        <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-bg-primary-dark text-text-primary-dark' : 'bg-bg-primary-light text-text-primary-light'}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <BookOpen size={28} className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} />
                        <h1 className="text-3xl font-serif font-bold">My Dictionary</h1>
                        {words && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-brand-primary-dark/20 text-brand-primary-dark' : 'bg-brand-primary-light/20 text-brand-primary-light'}`}>
                                {words.length} words
                            </span>
                        )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        Your personal vocabulary collection from RC practice.
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search your words..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                                isDark 
                                    ? 'bg-bg-secondary-dark border-border-dark text-text-primary-dark focus:ring-brand-primary-dark/50 focus:border-brand-primary-dark' 
                                    : 'bg-bg-secondary-light border-border-light text-text-primary-light focus:ring-brand-primary-light/50 focus:border-brand-primary-light'
                            }`}
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleSort('date')}
                            className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                sort === 'date' 
                                    ? (isDark ? 'bg-brand-primary-dark/20 border-brand-primary-dark text-brand-primary-dark' : 'bg-brand-primary-light/10 border-brand-primary-light text-brand-primary-light')
                                    : (isDark ? 'border-border-dark hover:bg-bg-secondary-dark' : 'border-border-light hover:bg-bg-secondary-light')
                            }`}
                        >
                            Date Added
                            {sort === 'date' && (order === 'desc' ? <SortDesc size={14} className="ml-2" /> : <SortAsc size={14} className="ml-2" />)}
                        </button>
                        <button 
                            onClick={() => toggleSort('alphabetical')}
                            className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                sort === 'alphabetical' 
                                    ? (isDark ? 'bg-brand-primary-dark/20 border-brand-primary-dark text-brand-primary-dark' : 'bg-brand-primary-light/10 border-brand-primary-light text-brand-primary-light')
                                    : (isDark ? 'border-border-dark hover:bg-bg-secondary-dark' : 'border-border-light hover:bg-bg-secondary-light')
                            }`}
                        >
                            Alphabetical
                            {sort === 'alphabetical' && (order === 'desc' ? <SortDesc size={14} className="ml-2" /> : <SortAsc size={14} className="ml-2" />)}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {(isLoading || isFetching) && !words && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-32 rounded-xl animate-pulse ${isDark ? 'bg-bg-secondary-dark/50' : 'bg-bg-secondary-light/50'}`} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && words?.length === 0 && (
                    <div className={`text-center py-20 rounded-xl border border-dashed ${isDark ? 'border-border-dark bg-bg-secondary-dark/20' : 'border-border-light bg-bg-secondary-light/20'}`}>
                        <BookOpen size={48} className={`mx-auto mb-4 opacity-50 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`} />
                        <h3 className="text-xl font-medium mb-2">Your dictionary is empty</h3>
                        <p className={`max-w-md mx-auto ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                            {search 
                                ? "No words match your search." 
                                : "Double-click any word in an RC passage (after completing the test) to start building your vocabulary."}
                        </p>
                    </div>
                )}

                {/* Word List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {words?.map((word, index) => (
                            <motion.div
                                key={word.word_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onClick={() => setExpandedWordId(expandedWordId === word.word_id ? null : word.word_id)}
                                className={`
                                    p-5 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isDark 
                                        ? 'bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark/50' 
                                        : 'bg-bg-secondary-light border-border-light hover:border-brand-primary-light/50'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold capitalize mb-1">{word.word}</h3>
                                        {word.pronunciation && (
                                            <span className={`text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                                {word.pronunciation}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={(e) => handleRemove(e, word.word_id, word.word)}
                                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-500'}`}
                                            title="Remove from dictionary"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className={`p-1 rounded-full ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'}`}>
                                            {expandedWordId === word.word_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="font-medium">1. {word.meanings[0]?.meaning}</p>
                                    
                                    {/* Collapsed preview mnemonic */}
                                    {expandedWordId !== word.word_id && word.mnemonic && (
                                        <p className={`mt-2 text-sm italic ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                            💡 {word.mnemonic}
                                        </p>
                                    )}
                                </div>

                                {/* Expanded View */}
                                <AnimatePresence>
                                    {expandedWordId === word.word_id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 mt-4 border-t space-y-4 border-opacity-10 border-current">
                                                
                                                {/* All Meanings */}
                                                <div className="space-y-2">
                                                    {word.meanings.map((m, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <p><span className="font-medium opacity-60 mr-2">{idx + 1}.</span> {m.meaning}</p>
                                                            {m.example && <p className={`mt-1 pl-5 italic ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>"{m.example}"</p>}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Mnemonic & Breakdown */}
                                                {(word.mnemonic || word.breakdown) && (
                                                    <div className={`p-3 rounded-lg text-sm space-y-2 ${isDark ? 'bg-bg-tertiary-dark/50' : 'bg-bg-tertiary-light/50'}`}>
                                                        {word.mnemonic && <p><span className="font-semibold">🧠 Sound-Alike:</span> {word.mnemonic}</p>}
                                                        {word.breakdown && <p><span className="font-semibold">🧩 Breakdown:</span> {word.breakdown}</p>}
                                                    </div>
                                                )}

                                                {/* Relate With & Origin */}
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    {word.relate_with && (
                                                        <div>
                                                            <span className="font-semibold opacity-70 block mb-1">🔗 Relate With</span>
                                                            <p className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>{word.relate_with}</p>
                                                        </div>
                                                    )}
                                                    {word.origin && (
                                                        <div>
                                                            <span className="font-semibold opacity-70 block mb-1">🌍 Origin</span>
                                                            <p className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>{word.origin}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Synonyms & Antonyms */}
                                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
                                                    {word.synonyms && word.synonyms.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold opacity-70 mr-2">Synonyms:</span>
                                                            <span className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>{word.synonyms.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    {word.antonyms && word.antonyms.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold opacity-70 mr-2">Antonyms:</span>
                                                            <span className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>{word.antonyms.join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Source Context */}
                                                {word.source_context && (
                                                    <div className={`pt-3 mt-3 border-t text-xs ${isDark ? 'border-border-dark text-text-muted-dark' : 'border-border-light text-text-muted-light'}`}>
                                                        Found in your reading: <span className="italic">"{word.source_context}"</span>
                                                    </div>
                                                )}

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DictionaryPage;
