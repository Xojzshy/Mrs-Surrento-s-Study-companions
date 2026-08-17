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
    <div className="min-h-screen bg-black transition-colors pb-20">
      {/* Header */}
      <header className="bg-black border-b border-stone-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-stone-400 hover:text-stone-300 rounded-full hover:bg-stone-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
          <h1 className="text-xl font-serif text-white flex-1 truncate">{subject.name}</h1>
        </div>
      </header>

      {/* Path View */}
      {!selectedTopic ? (
        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
          {subject.whyNote && (
            <div className="mb-12 bg-black rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-800 relative overflow-hidden group hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] transition-all">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${subject.color}`} />
              <div className="flex items-start gap-4 sm:gap-6">
                <div className={`p-3 rounded-2xl bg-stone-900 text-stone-500 group-hover:text-yellow-500 transition-colors`}>
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-2">My Motivation</h2>
                  <p className="text-lg sm:text-xl font-serif text-white leading-relaxed italic">
                    "{subject.whyNote}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative py-4 flex flex-col items-center">
            {/* The Path Line */}
            <div className="absolute top-0 bottom-0 w-1 bg-stone-800 -z-10" />
            
            {topics.map((topic, i) => {
              const isMastered = topic.status === 'mastered';
              const offset = i % 2 === 0 ? '-translate-x-20 sm:-translate-x-24' : 'translate-x-20 sm:translate-x-24';
              
              return (
                <div key={topic.id} className={`relative mb-12 flex justify-center w-full ${offset}`}>
                  <button
                    onClick={() => setSelectedTopic(topic)}
                    className={`relative z-10 group flex flex-col items-center gap-2`}
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 border-black shadow-md transition-transform group-hover:scale-110 ${isMastered ? 'bg-yellow-500 text-black group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]' : `${subject.color} text-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]`}`}>
                      {isMastered ? <CheckCircle size={28} /> : <BookOpen size={28} />}
                    </div>
                    <span className="font-medium text-stone-200 bg-black px-3 py-1 rounded-full text-xs sm:text-sm shadow-sm border border-stone-800 text-center max-w-[120px] sm:max-w-[160px] truncate">
                      {topic.title}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Add Node */}
            <div className="relative mt-4">
              {isAddingTopic ? (
                <form onSubmit={handleAddTopic} className="bg-black p-4 rounded-2xl shadow-lg border border-stone-800 flex flex-col gap-3 min-w-[250px] shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-3 outline-none focus:border-stone-600 text-sm text-white"
                    placeholder="New Topic Name"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingTopic(false)} className="px-3 py-2 text-sm font-medium text-stone-400">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg">Add</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingTopic(true)}
                  className="w-14 h-14 rounded-full bg-zinc-950 text-stone-400 hover:text-white hover:bg-stone-900 flex items-center justify-center transition-all border-4 border-black shadow-sm z-10 relative hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
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
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-6 font-medium text-sm transition-colors py-2"
          >
            ← Back to path
          </button>
          
          <div className="bg-black rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-800 space-y-8 transition-colors hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white mb-3">{selectedTopic.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1 text-xs font-medium rounded-full text-white ${subject.color}`}>
                  {subject.name}
                </div>
                {selectedTopic.status === 'mastered' && (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                    <CheckCircle size={12} /> Mastered
                  </div>
                )}
              </div>
            </div>

            {!selectedTopic.cachedMaterial ? (
              <div className="text-center py-16 px-4 bg-stone-900/50 rounded-2xl border border-dashed border-stone-800">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to learn?</h3>
                <p className="text-stone-400 mb-6 max-w-md mx-auto">
                  I can build a custom study guide for you right now. Just say the word.
                </p>
                <button
                  onClick={() => generateMaterial(selectedTopic)}
                  disabled={isGenerating}
                  className="px-6 py-3.5 bg-white text-black rounded-full font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  {isGenerating ? 'Thinking...' : 'Generate Study Guide'}
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="prose prose-invert max-w-none">
                  <p className="text-base sm:text-lg text-stone-300 leading-relaxed">
                    {selectedTopic.cachedMaterial.summary}
                  </p>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-2xl">
                  <h4 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
                    <Sparkles size={18} /> Why this matters
                  </h4>
                  <p className="text-yellow-200/80">{selectedTopic.cachedMaterial.whyItMatters}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-4">Helpful Resources</h4>
                  <div className="space-y-3">
                    {selectedTopic.cachedMaterial.resources.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 bg-stone-900/50 hover:bg-stone-900 rounded-xl transition-all group border border-stone-800 hover:border-yellow-500/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                      >
                        <span className="font-medium text-stone-300 group-hover:text-white">{res.title}</span>
                        <ExternalLink size={18} className="text-stone-500 group-hover:text-yellow-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                  <button
                    onClick={() => generateMaterial(selectedTopic)}
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-stone-900 text-stone-300 rounded-full font-medium hover:bg-stone-800 hover:text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => setShowLightningRound(true)}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-yellow-500 text-black rounded-full font-medium hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all shadow-sm inline-flex items-center justify-center gap-2"
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
