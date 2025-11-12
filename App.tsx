
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MemoryItem, Revision } from './types';
import { PlusIcon, CalendarIcon } from './components/icons';

const REVISION_INTERVALS = [1, 7, 30]; // in days

const Header: React.FC<{
    activeView: 'add' | 'schedule';
    setActiveView: (view: 'add' | 'schedule') => void;
}> = ({ activeView, setActiveView }) => {
    const baseButtonClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200";
    const activeButtonClasses = "bg-sky-500 text-white shadow-md";
    const inactiveButtonClasses = "bg-gray-700 hover:bg-gray-600";

    return (
        <header className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
                <span role="img" aria-label="rooster" className="text-4xl">🐓</span>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                    Recall Rooster
                </h1>
            </div>
            <p className="text-gray-400 text-center">Master anything by scheduling your revisions with the power of spaced repetition.</p>
            <nav className="mt-4 p-1.5 bg-gray-800 rounded-xl flex gap-2">
                <button
                    onClick={() => setActiveView('add')}
                    className={`${baseButtonClasses} ${activeView === 'add' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    <PlusIcon />
                    Add Memory
                </button>
                <button
                    onClick={() => setActiveView('schedule')}
                    className={`${baseButtonClasses} ${activeView === 'schedule' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    <CalendarIcon />
                    Revision Schedule
                </button>
            </nav>
        </header>
    );
};

const AddMemoryView: React.FC<{ onAddMemory: (topic: string) => void }> = ({ onAddMemory }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (topic.trim()) {
            onAddMemory(topic.trim());
            setTopic('');
        }
    };

    return (
        <div className="w-full animate-fade-in">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Chapter 1 of 'Atomic Habits'"
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                />
                <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!topic.trim()}
                >
                    <PlusIcon />
                    Save to Memory
                </button>
            </form>
        </div>
    );
};

const ScheduleView: React.FC<{ memoryItems: MemoryItem[], onDeleteMemory: (id: string) => void }> = ({ memoryItems, onDeleteMemory }) => {
    const schedule = useMemo(() => {
        const allRevisions: Revision[] = [];
        memoryItems.forEach(item => {
            const dateAdded = new Date(item.dateAdded);
            REVISION_INTERVALS.forEach((days, index) => {
                const revisionDate = new Date(dateAdded);
                revisionDate.setDate(revisionDate.getDate() + days);
                revisionDate.setHours(0, 0, 0, 0);

                allRevisions.push({
                    memoryId: item.id,
                    topic: item.topic,
                    revisionDate: revisionDate.toISOString(),
                    revisionNumber: index + 1,
                });
            });
        });

        const sorted = allRevisions.sort((a, b) => new Date(a.revisionDate).getTime() - new Date(b.revisionDate).getTime());
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const futureRevisions = sorted.filter(rev => new Date(rev.revisionDate) >= today);

        return futureRevisions.reduce((acc, revision) => {
            const dateString = new Date(revision.revisionDate).toISOString().split('T')[0];
            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push(revision);
            return acc;
        }, {} as Record<string, Revision[]>);
    }, [memoryItems]);

    const getRelativeDateLabel = (dateString: string) => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const revisionDate = new Date(dateString);
        
        if (today.toDateString() === revisionDate.toDateString()) return 'Today';
        if (tomorrow.toDateString() === revisionDate.toDateString()) return 'Tomorrow';

        return null;
    };

    if (memoryItems.length === 0) {
        return <p className="text-center text-gray-400 mt-8 animate-fade-in">Your schedule is empty. Add a memory to get started!</p>;
    }

    const scheduledDates = Object.keys(schedule);

    if (scheduledDates.length === 0) {
        return <p className="text-center text-gray-400 mt-8 animate-fade-in">All revisions are complete. Great job!</p>;
    }

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {scheduledDates.map(dateString => {
                const revisions = schedule[dateString];
                const revisionDate = new Date(revisions[0].revisionDate);
                const relativeLabel = getRelativeDateLabel(revisionDate.toISOString());
                const formattedDate = revisionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                return (
                    <div key={dateString} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
                           {relativeLabel && <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2 py-1 rounded-full">{relativeLabel}</span>}
                           {formattedDate}
                        </h3>
                        <ul className="mt-3 space-y-3">
                            {revisions.map((revision, index) => (
                                <li key={`${revision.memoryId}-${index}`} className="flex justify-between items-center bg-gray-700 p-3 rounded-md group">
                                    <div>
                                        <p className="font-medium text-gray-100">{revision.topic}</p>
                                        <span className="text-xs text-gray-400 bg-gray-600 px-2 py-0.5 rounded-full">
                                            Revision #{revision.revisionNumber}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => onDeleteMemory(revision.memoryId)} 
                                        className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete this memory and all its revisions"
                                     >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

export default function App() {
    const [view, setView] = useState<'add' | 'schedule'>('add');
    const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(() => {
        try {
            const items = localStorage.getItem('memoryItems');
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error("Error reading from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('memoryItems', JSON.stringify(memoryItems));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [memoryItems]);
    
    const handleAddMemory = useCallback((topic: string) => {
        const newItem: MemoryItem = {
            id: Date.now().toString(),
            topic,
            dateAdded: new Date().toISOString(),
        };
        setMemoryItems(prevItems => [...prevItems, newItem]);
        setView('schedule'); // Switch to schedule view after adding
    }, []);
    
    const handleDeleteMemory = useCallback((idToDelete: string) => {
        if (window.confirm("Are you sure you want to delete this memory and all its scheduled revisions?")) {
            setMemoryItems(prevItems => prevItems.filter(item => item.id !== idToDelete));
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6">
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
              }
            `}</style>
            <Header activeView={view} setActiveView={setView} />
            <main className="w-full max-w-2xl mx-auto mt-6">
                {view === 'add' ? (
                    <AddMemoryView onAddMemory={handleAddMemory} />
                ) : (
                    <ScheduleView memoryItems={memoryItems} onDeleteMemory={handleDeleteMemory} />
                )}
            </main>
        </div>
    );
}
