import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Subject, Topic } from '../types';
import { ArrowLeft, Plus, Sparkles, BookOpen, ExternalLink, CheckCircle, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LightningRound } from '../components/LightningRound';

export function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLightningRound, setShowLightningRound] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    
    // Fetch Subject
    const unsubSubject = onSnapshot(doc(db, 'subjects', id), (docSnap) => {
      if (docSnap.exists()) {
        setSubject({ id: docSnap.id, ...docSnap.data() } as Subject);
      }
    });

    // Fetch Topics
    const q = query(collection(db, 'topics'), where('subjectId', '==', id));
    const unsubTopics = onSnapshot(q, (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
    });

    return () => { unsubSubject(); unsubTopics(); };
  }, [id, user]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newTopicName.trim()) return;
    
    await addDoc(collection(db, 'topics'), {
      subjectId: id,
      title: newTopicName.trim(),
      status: 'unlocked', // Free unlock structure
      ownerId: user.uid
    });
    
    setIsAddingTopic(false);
    setNewTopicName('');
  };

  const generateMaterial = async (topic: Topic) => {
    if (!subject) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.title, subject: subject.name })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await updateDoc(doc(db, 'topics', topic.id), {
          cachedMaterial: data
        });
      } else {
        alert(data.error || "Failed to generate");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating material.");
    } finally {
      setIsGenerating(false);
    }
  };

  const markMastered = async (topicId: string) => {
    await updateDoc(doc(db, 'topics', topicId), {
      status: 'mastered'
    });
    // Add XP to user
    if (user && profile) {
      await updateDoc(doc(db, 'users', user.uid), {
        xp: profile.xp + 50
      });
    }
    setSelectedTopic(null); // Go back to path
  };

  if (!subject) return <div className="p-8 text-stone-500 dark:text-stone-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
          <h1 className="text-xl font-serif text-stone-800 dark:text-stone-100 flex-1 truncate">{subject.name}</h1>
        </div>
      </header>

      {/* Path View */}
      {!selectedTopic ? (
        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
          {subject.whyNote && (
            <div className="mb-12 bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-100 dark:border-stone-800 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${subject.color}`} />
              <div className="flex items-start gap-4 sm:gap-6">
                <div className={`p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500`}>
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">My Motivation</h2>
                  <p className="text-lg sm:text-xl font-serif text-stone-800 dark:text-stone-100 leading-relaxed italic">
                    "{subject.whyNote}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative py-4 flex flex-col items-center">
            {/* The Path Line */}
            <div className="absolute top-0 bottom-0 w-1 bg-stone-200 dark:bg-stone-800 -z-10" />
            
            {topics.map((topic, i) => {
              const isMastered = topic.status === 'mastered';
              const offset = i % 2 === 0 ? '-translate-x-20 sm:-translate-x-24' : 'translate-x-20 sm:translate-x-24';
              
              return (
                <div key={topic.id} className={`relative mb-12 flex justify-center w-full ${offset}`}>
                  <button
                    onClick={() => setSelectedTopic(topic)}
                    className={`relative z-10 group flex flex-col items-center gap-2`}
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 border-stone-50 dark:border-stone-950 shadow-md transition-transform group-hover:scale-110 ${isMastered ? 'bg-amber-400 text-white' : `${subject.color} text-white`}`}>
                      {isMastered ? <CheckCircle size={28} /> : <BookOpen size={28} />}
                    </div>
                    <span className="font-medium text-stone-700 dark:text-stone-200 bg-white/90 dark:bg-stone-900/90 px-3 py-1 rounded-full text-xs sm:text-sm backdrop-blur-sm shadow-sm border border-stone-100 dark:border-stone-800 text-center max-w-[120px] sm:max-w-[160px] truncate">
                      {topic.title}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Add Node */}
            <div className="relative mt-4">
              {isAddingTopic ? (
                <form onSubmit={handleAddTopic} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 flex flex-col gap-3 min-w-[250px]">
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-3 outline-none focus:border-stone-300 dark:focus:border-stone-700 text-sm text-stone-800 dark:text-stone-100"
                    placeholder="New Topic Name"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingTopic(false)} className="px-3 py-2 text-sm font-medium text-stone-500 dark:text-stone-400">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg">Add</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingTopic(true)}
                  className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center transition-all border-4 border-stone-50 dark:border-stone-950 shadow-sm z-10 relative"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>
        </main>
      ) : (
        /* Study View */
        <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          <button 
            onClick={() => setSelectedTopic(null)}
            className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 mb-6 font-medium text-sm transition-colors py-2"
          >
            ← Back to path
          </button>
          
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-100 dark:border-stone-800 space-y-8 transition-colors">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-800 dark:text-stone-100 mb-3">{selectedTopic.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1 text-xs font-medium rounded-full text-white ${subject.color}`}>
                  {subject.name}
                </div>
                {selectedTopic.status === 'mastered' && (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Mastered
                  </div>
                )}
              </div>
            </div>

            {!selectedTopic.cachedMaterial ? (
              <div className="text-center py-16 px-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-medium text-stone-800 dark:text-stone-100 mb-2">Ready to learn?</h3>
                <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
                  I can build a custom study guide for you right now. Just say the word.
                </p>
                <button
                  onClick={() => generateMaterial(selectedTopic)}
                  disabled={isGenerating}
                  className="px-6 py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isGenerating ? 'Thinking...' : 'Generate Study Guide'}
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed">
                    {selectedTopic.cachedMaterial.summary}
                  </p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-5 rounded-2xl">
                  <h4 className="text-amber-800 dark:text-amber-400 font-semibold mb-2 flex items-center gap-2">
                    <Sparkles size={18} /> Why this matters
                  </h4>
                  <p className="text-amber-700 dark:text-amber-200/80">{selectedTopic.cachedMaterial.whyItMatters}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Helpful Resources</h4>
                  <div className="space-y-3">
                    {selectedTopic.cachedMaterial.resources.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors group border border-stone-100 dark:border-stone-800"
                      >
                        <span className="font-medium text-stone-700 dark:text-stone-300">{res.title}</span>
                        <ExternalLink size={18} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                  <button
                    onClick={() => generateMaterial(selectedTopic)}
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-full font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => setShowLightningRound(true)}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                  >
                    <Zap size={18} className="fill-amber-100" />
                    Lightning Round
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <AnimatePresence>
            {showLightningRound && (
              <LightningRound 
                topic={selectedTopic} 
                onComplete={() => {
                  setShowLightningRound(false);
                  setSelectedTopic(null); // return to path
                }} 
              />
            )}
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}
