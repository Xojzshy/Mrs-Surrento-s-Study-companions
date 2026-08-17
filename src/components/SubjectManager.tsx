import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Subject } from '../types';
import { Plus, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = [
  'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-amber-500'
];

export function SubjectManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: COLORS[0], whyNote: '' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subjects'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(data);
    });
    return unsubscribe;
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubject.name.trim() || !newSubject.whyNote.trim()) return;
    
    await addDoc(collection(db, 'subjects'), {
      name: newSubject.name.trim(),
      color: newSubject.color,
      whyNote: newSubject.whyNote.trim(),
      ownerId: user.uid
    });
    
    setIsAdding(false);
    setNewSubject({ name: '', color: COLORS[0], whyNote: '' });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjects.map(subject => (
          <div 
            key={subject.id} 
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="p-4 rounded-2xl border border-stone-800 bg-black shadow-sm flex flex-col justify-between min-h-[120px] group cursor-pointer hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                <h3 className="font-medium text-white">{subject.name}</h3>
              </div>
              {subject.whyNote && (
                <p className="text-sm text-stone-400 line-clamp-2 italic">"{subject.whyNote}"</p>
              )}
            </div>
            <div className="pt-4 text-xs font-medium text-stone-500 group-hover:text-yellow-400 transition-colors">
              View Topics →
            </div>
          </div>
        ))}

        <button 
          onClick={() => setIsAdding(true)}
          className="p-4 rounded-2xl border border-stone-800 border-dashed bg-black text-stone-400 hover:text-yellow-400 hover:border-yellow-500/50 flex flex-col items-center justify-center min-h-[120px] hover:bg-stone-900 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
        >
          <Plus size={24} className="mb-2" />
          <span className="font-medium text-sm">New Subject</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black rounded-[2rem] p-6 w-full max-w-md shadow-2xl shadow-yellow-500/10 relative border border-stone-800"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-300 rounded-full"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-serif text-white mb-6">Add New Subject</h2>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-yellow-500/50 text-white transition-colors"
                    placeholder="e.g. Organic Chemistry"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2 flex items-center gap-2">
                    <Palette size={16} /> Color Tag
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewSubject({ ...newSubject, color })}
                        className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full ${color} transition-transform ${newSubject.color === color ? 'scale-110 ring-2 ring-offset-2 ring-stone-600 ring-offset-stone-900' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Why I'm studying this</label>
                  <textarea
                    required
                    value={newSubject.whyNote}
                    onChange={(e) => setNewSubject({ ...newSubject, whyNote: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-yellow-500/50 text-white transition-colors resize-none"
                    placeholder="e.g. To finally understand carbon bonds."
                    rows={2}
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-yellow-500 text-black font-medium rounded-full hover:bg-yellow-400 transition-colors"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
