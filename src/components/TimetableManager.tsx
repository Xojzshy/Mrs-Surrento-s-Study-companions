import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TimetableEntry, Subject } from '../types';
import { Plus, X, Clock, MapPin, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parse } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function TimetableManager() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ subjectId: '', day: 'Monday', startTime: '09:00', endTime: '10:00', location: '' });

  useEffect(() => {
    if (!user) return;
    const qEntries = query(collection(db, 'timetableEntries'), where('ownerId', '==', user.uid));
    const unsubEntries = onSnapshot(qEntries, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry)));
    });

    const qSubjects = query(collection(db, 'subjects'), where('ownerId', '==', user.uid));
    const unsubSubjects = onSnapshot(qSubjects, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });

    return () => { unsubEntries(); unsubSubjects(); };
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEntry.subjectId) return;
    
    await addDoc(collection(db, 'timetableEntries'), {
      ...newEntry,
      ownerId: user.uid
    });
    
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this class?')) {
      await deleteDoc(doc(db, 'timetableEntries', id));
    }
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  return (
    <>
      <div className="space-y-6">
        {DAYS.map(day => {
          const dayEntries = entries.filter(e => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (dayEntries.length === 0) return null;
          
          return (
            <div key={day} className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{day}</h3>
              <div className="space-y-3">
                {dayEntries.map(entry => {
                  const subject = getSubject(entry.subjectId);
                  if (!subject) return null;
                  
                  return (
                    <div key={entry.id} className="relative group bg-black border border-stone-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-1.5 h-12 rounded-full ${subject.color}`} />
                        <div>
                          <h4 className="font-medium text-white">{subject.name}</h4>
                          <div className="flex items-center gap-4 text-xs font-medium text-stone-400 mt-1">
                            <span className="flex items-center gap-1"><Clock size={14} /> {entry.startTime} - {entry.endTime}</span>
                            {entry.location && <span className="flex items-center gap-1"><MapPin size={14} /> {entry.location}</span>}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {entries.length === 0 && (
          <div className="text-center py-12 text-stone-500 bg-stone-900/50 rounded-2xl border border-dashed border-stone-800">
            <p>No classes scheduled yet.</p>
          </div>
        )}
        
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-3.5 sm:py-3 bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-white border-purple-500 rounded-xl font-medium transition-all border shadow-sm"
        >
          Add Class Block
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
              className="bg-black rounded-[2rem] p-6 w-full max-w-md shadow-2xl shadow-purple-500/10 relative border border-stone-800"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-300 rounded-full"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-serif text-white mb-6">Add Class Block</h2>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Subject</label>
                  {subjects.length === 0 ? (
                    <div className="p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl">
                      Please create a subject first!
                    </div>
                  ) : (
                    <select
                      required
                      value={newEntry.subjectId}
                      onChange={(e) => setNewEntry({ ...newEntry, subjectId: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-purple-500/50 text-white transition-colors"
                    >
                      <option value="" disabled>Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Day of Week</label>
                  <select
                    required
                    value={newEntry.day}
                    onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-purple-500/50 text-white transition-colors"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-purple-500/50 text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-purple-500/50 text-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Location (Optional)</label>
                  <input
                    type="text"
                    value={newEntry.location}
                    onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 sm:py-2.5 outline-none focus:border-purple-500/50 text-white transition-colors"
                    placeholder="e.g. Room 402"
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={subjects.length === 0 || !newEntry.subjectId}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-purple-500 text-white font-medium rounded-full hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Class
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
