import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, RotateCw, CheckCircle2, XCircle, Brain, Target, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getFlashcards, createFlashcard, updateFlashcardStatus, deleteFlashcard as deleteFlashcardApi, getSubjectsByExamNameAndStreamName, getSubjectsByStreamName } from '../services/api';

const FlashcardsPage = () => {
  const { dbUser } = useAuth();
  const [SUBJECTS, setSUBJECTS] = useState([]);
  const [cards, setCards] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newCard, setNewCard] = useState({ subject: '', front: '', back: '' });

  // Fetch subjects from backend
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!dbUser?.stream) return;
      try {
        let res;
        // Try fetching with exam+stream first
        if (dbUser.exam && dbUser.stream) {
          try {
            res = await getSubjectsByExamNameAndStreamName(dbUser.exam, dbUser.stream);
          } catch (error) {
            console.warn('Error fetching subjects by exam+stream, falling back to stream only:', error);
            res = await getSubjectsByStreamName(dbUser.stream);
          }
        } else {
          res = await getSubjectsByStreamName(dbUser.stream);
        }
        const subjectNames = Array.isArray(res.data) ? res.data.map(s => s.name || s) : [];
        setSUBJECTS(subjectNames);
        if (subjectNames.length > 0) setNewCard(prev => ({ ...prev, subject: subjectNames[0] }));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchSubjects();
  }, [dbUser?.exam, dbUser?.stream]);

  // Load flashcards from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchCards = async () => {
      try {
        const res = await getFlashcards(dbUser.id);
        setCards(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      }
    };
    fetchCards();
  }, [dbUser?.id]);

  const filteredCards = selectedSubject === 'All' ? cards : cards.filter(c => c.subject === selectedSubject);
  const masteredCount = filteredCards.filter(c => c.status === 'Mastered').length;
  const totalCount = filteredCards.length;

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCard.front.trim() || !newCard.back.trim() || !dbUser?.id) return;
    
    try {
      const res = await createFlashcard(dbUser.id, { ...newCard, status: 'New' });
      setCards([...cards, res.data]);
    } catch (error) {
      console.error('Error creating flashcard:', error);
    }
    setShowAddModal(false);
    setNewCard({ subject: SUBJECTS[0] || '', front: '', back: '' });
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateFlashcardStatus(id, status);
      setCards(cards.map(c => c.id === id ? { ...c, status } : c));
    } catch (error) {
      console.error('Error updating flashcard status:', error);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 150);
  };

  const deleteCard = async (id) => {
    try {
      await deleteFlashcardApi(id);
      setCards(cards.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting flashcard:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Tips Section */}
        <div className="mb-6 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">🧠 Active Recall with Flashcards</h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Formulate your answers before flipping the card for maximum retention.</li>
                <li>• Use the "Needs Practice" button if you hesitated—spaced repetition helps.</li>
                <li>• Create atomic flashcards: One concept, one question per card.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Controls & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Deck Progress: <span className="text-slate-900 dark:text-white font-bold">{masteredCount}/{totalCount}</span> Mastered ({totalCount ? Math.round((masteredCount/totalCount)*100) : 0}%)
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={selectedSubject} 
              onChange={(e) => { setSelectedSubject(e.target.value); setCurrentCardIndex(0); setIsFlipped(false); }}
              className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] text-sm text-slate-800 dark:text-white rounded-lg px-4 py-2 outline-none focus:border-purple-300 dark:focus:border-purple-500/50"
            >
              <option value="All">All Subjects</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => { setReviewMode(!reviewMode); setCurrentCardIndex(0); setIsFlipped(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${reviewMode ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' : 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white'}`}
            >
              {reviewMode ? 'Exit Review' : 'Start Review'}
            </button>
            <button onClick={() => setShowAddModal(true)} className="p-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 dark:bg-white/[0.05] rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-purple-500 transition-all duration-500" 
            style={{ width: `${totalCount ? (masteredCount/totalCount)*100 : 0}%` }} 
          />
        </div>

        {reviewMode && filteredCards.length > 0 ? (
          /* Review Mode UI */
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-full max-w-2xl relative" style={{ perspective: '1000px' }}>
              <div 
                className={`w-full aspect-video md:aspect-[2/1] relative transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-[#0a0f1e] dark:to-[#12182b] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-8 flex flex-col justify-center items-center text-center backface-hidden shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs text-slate-500">
                    <span className="bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">{filteredCards[currentCardIndex].subject}</span>
                    <span>Card {currentCardIndex + 1} of {filteredCards.length}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mt-4">{filteredCards[currentCardIndex].front}</h2>
                  <div className="absolute bottom-4 text-xs text-slate-500 flex items-center gap-2">
                    <RotateCw size={14} /> Click to flip
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-[#12182b] dark:to-[#0a0f1e] border border-purple-200 dark:border-purple-500/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center backface-hidden rotate-y-180 shadow-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs text-slate-500">
                    <span className="bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">{filteredCards[currentCardIndex].subject}</span>
                    <span>Answer</span>
                  </div>
                  <p className="text-lg md:text-xl text-slate-800 dark:text-white mt-4 max-w-lg leading-relaxed">{filteredCards[currentCardIndex].back}</p>
                </div>
              </div>
            </div>

            {/* Review Controls */}
            <div className="flex items-center gap-6 mt-8">
              <button onClick={prevCard} className="p-3 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-transparent rounded-full text-slate-600 dark:text-white transition-colors shadow-sm">
                <ChevronLeft size={24} />
              </button>
              
              {isFlipped && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <button 
                    onClick={() => { handleStatusUpdate(filteredCards[currentCardIndex].id, 'Needs Practice'); nextCard(); }}
                    className="flex flex-col items-center gap-2 text-rose-500 dark:text-rose-400 hover:scale-105 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center">
                      <XCircle size={24} />
                    </div>
                    <span className="text-xs font-bold">Needs Practice</span>
                  </button>
                  <button 
                    onClick={() => { handleStatusUpdate(filteredCards[currentCardIndex].id, 'Mastered'); nextCard(); }}
                    className="flex flex-col items-center gap-2 text-emerald-500 dark:text-emerald-400 hover:scale-105 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="text-xs font-bold">Mastered</span>
                  </button>
                </div>
              )}

              <button onClick={nextCard} className="p-3 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-transparent rounded-full text-slate-600 dark:text-white transition-colors shadow-sm">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        ) : reviewMode ? (
          <div className="py-20 text-center text-slate-500">No cards in this deck. Add some cards to start reviewing!</div>
        ) : (
          /* Grid Mode UI */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div key={card.id} className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors group relative shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded">{card.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${card.status === 'Mastered' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : card.status === 'Needs Practice' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                      {card.status}
                    </span>
                    <button onClick={() => deleteCard(card.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Q:</h4>
                  <p className="text-sm text-slate-900 dark:text-white font-medium mb-3 line-clamp-2">{card.front}</p>
                  <div className="h-px w-full bg-slate-100 dark:bg-white/[0.05] my-2"></div>
                  <h4 className="text-sm font-bold text-slate-500 mb-1">A:</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{card.back}</p>
                </div>
              </div>
            ))}
            {filteredCards.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                No cards found. Click the + button to create one!
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/[0.1] p-6 max-w-md w-full rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create Flashcard</h3>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Subject</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-purple-500"
                  value={newCard.subject}
                  onChange={(e) => setNewCard({...newCard, subject: e.target.value})}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Question (Front)</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-purple-500 resize-none"
                  value={newCard.front}
                  onChange={(e) => setNewCard({...newCard, front: e.target.value})}
                  placeholder="e.g., Explain the ACID properties..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Answer (Back)</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-purple-500 resize-none"
                  value={newCard.back}
                  onChange={(e) => setNewCard({...newCard, back: e.target.value})}
                  placeholder="Brief, concise answer..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg transition-colors font-medium">
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardsPage;
