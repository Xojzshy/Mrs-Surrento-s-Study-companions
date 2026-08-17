import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Course, CourseTopic, Objective } from '../types';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, CheckCircle, Circle, BookOpen, Target, ArrowLeft } from 'lucide-react';

export function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'courses'),
      where('ownerId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCourses(data);
      setLoading(false);
    });
  }, [user]);

  const addCourse = async () => {
    if (!user) return;
    await addDoc(collection(db, 'courses'), {
      name: 'New Course',
      description: '',
      order: courses.length,
      ownerId: user.uid
    });
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    await updateDoc(doc(db, 'courses', id), updates);
  };

  const deleteCourse = async (id: string) => {
    await deleteDoc(doc(db, 'courses', id));
  };

  return (
    <div className="min-h-screen bg-black transition-colors pb-20">
      <header className="bg-black border-b border-stone-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-stone-400 hover:text-stone-300 rounded-full hover:bg-stone-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-serif text-white flex-1 truncate flex items-center gap-2">
              <BookOpen size={20} className="text-fuchsia-500" /> My Courses
            </h1>
          </div>
          <button
            onClick={addCourse}
            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-medium transition-colors hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]"
          >
            <Plus size={16} /> Add Course
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/50 rounded-2xl border border-dashed border-stone-800">
            <BookOpen size={48} className="mx-auto text-stone-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Courses Yet</h3>
            <p className="text-stone-400 mb-6">Create a course to start organizing your study material.</p>
            <button
              onClick={addCourse}
              className="px-6 py-2.5 bg-white text-black font-medium rounded-full hover:bg-stone-200 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Create Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <CourseAccordion 
                key={course.id} 
                course={course} 
                isExpanded={expandedCourse === course.id}
                onToggle={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                onUpdate={(updates) => updateCourse(course.id, updates)}
                onDelete={() => deleteCourse(course.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CourseAccordion({ 
  course, 
  isExpanded, 
  onToggle, 
  onUpdate, 
  onDelete 
}: { 
  course: Course; 
  isExpanded: boolean; 
  onToggle: () => void;
  onUpdate: (updates: Partial<Course>) => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(course.name);

  useEffect(() => {
    if (!user || !isExpanded) return;
    const q = query(
      collection(db, 'courses', course.id, 'topics'),
      where('ownerId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseTopic));
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTopics(data);
    });
  }, [user, course.id, isExpanded]);

  const addTopic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await addDoc(collection(db, 'courses', course.id, 'topics'), {
      courseId: course.id,
      title: 'New Topic',
      objectives: [],
      order: topics.length,
      ownerId: user.uid
    });
    if (!isExpanded) onToggle();
  };

  const handleSave = () => {
    onUpdate({ name: editName });
    setIsEditing(false);
  };

  // Calculate course progress
  const allObjectives = topics.flatMap(t => t.objectives || []);
  const completedObjectives = allObjectives.filter(o => o.completed).length;
  const progressPercent = allObjectives.length === 0 ? 0 : Math.round((completedObjectives / allObjectives.length) * 100);

  return (
    <div className="bg-zinc-950 border border-stone-800 rounded-2xl overflow-hidden transition-all hover:border-stone-700">
      <div 
        className="p-4 sm:p-6 cursor-pointer flex items-center justify-between gap-4 hover:bg-stone-900/50 transition-colors group"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border border-stone-700 rounded-lg px-2 py-1 text-white text-lg font-serif outline-none focus:border-fuchsia-500 w-full max-w-sm"
              />
            ) : (
              <h2 className="text-lg font-serif text-white truncate flex items-center gap-2 group-hover:text-fuchsia-400 transition-colors">
                {course.name}
              </h2>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
              className="p-1.5 text-stone-500 hover:text-white hover:bg-stone-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden max-w-xs">
              <div 
                className="h-full bg-fuchsia-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-stone-400">
              {progressPercent}% <span className="hidden sm:inline">({completedObjectives}/{allObjectives.length})</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={addTopic}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-xs font-medium transition-colors border border-stone-800"
          >
            <Plus size={14} /> Topic
          </button>
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 group-hover:bg-stone-800 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-800 bg-black"
          >
            <div className="p-4 sm:p-6 space-y-4">
              {topics.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-sm">
                  No topics yet. Click "Topic" to add one.
                </div>
              ) : (
                topics.map((topic, index) => (
                  <TopicAccordion 
                    key={topic.id} 
                    topic={topic}
                    courseId={course.id}
                  />
                ))
              )}
              
              {/* Mobile add topic button */}
              <button
                onClick={addTopic}
                className="sm:hidden w-full flex items-center justify-center gap-2 py-3 bg-stone-900 text-stone-400 rounded-xl text-sm border border-stone-800 border-dashed hover:text-stone-300 hover:border-stone-700 transition-colors"
              >
                <Plus size={16} /> Add Topic
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopicAccordion({ topic, courseId }: { topic: CourseTopic, courseId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);

  const updateTopic = async (updates: Partial<CourseTopic>) => {
    await updateDoc(doc(db, 'courses', courseId, 'topics', topic.id), updates);
  };

  const deleteTopic = async () => {
    await deleteDoc(doc(db, 'courses', courseId, 'topics', topic.id));
  };

  const handleSave = () => {
    updateTopic({ title: editTitle });
    setIsEditing(false);
  };

  const addObjective = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newObjectives = [...(topic.objectives || []), { text: 'New Objective', completed: false }];
    updateTopic({ objectives: newObjectives });
    if (!isExpanded) setIsExpanded(true);
  };

  const toggleObjective = (index: number) => {
    const newObjectives = [...(topic.objectives || [])];
    newObjectives[index] = { ...newObjectives[index], completed: !newObjectives[index].completed };
    updateTopic({ objectives: newObjectives });
  };

  const updateObjectiveText = (index: number, newText: string) => {
    const newObjectives = [...(topic.objectives || [])];
    newObjectives[index] = { ...newObjectives[index], text: newText };
    updateTopic({ objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    const newObjectives = [...(topic.objectives || [])];
    newObjectives.splice(index, 1);
    updateTopic({ objectives: newObjectives });
  };

  const objectives = topic.objectives || [];
  const completed = objectives.filter(o => o.completed).length;
  const progress = objectives.length === 0 ? 0 : Math.round((completed / objectives.length) * 100);

  return (
    <div className="bg-stone-900/40 border border-stone-800/80 rounded-xl overflow-hidden transition-colors">
      <div 
        className="p-3 sm:p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-stone-900 transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Target size={16} className={`${progress === 100 ? 'text-emerald-500' : 'text-stone-500'}`} />
            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border border-stone-700 rounded text-stone-200 text-sm px-2 py-0.5 outline-none focus:border-emerald-500 w-full max-w-xs"
              />
            ) : (
              <h3 className={`text-sm font-medium truncate ${progress === 100 ? 'text-emerald-400' : 'text-stone-300'}`}>
                {topic.title}
              </h3>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
              className="p-1 text-stone-500 hover:text-white hover:bg-stone-800 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteTopic(); }}
              className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
          
          <div className="mt-2 flex items-center gap-2 ml-6">
            <div className="flex-1 h-1 bg-stone-800 rounded-full overflow-hidden max-w-[150px]">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-emerald-500/60'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-stone-500">
              {progress}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addObjective}
            className="hidden sm:flex items-center gap-1 px-2 py-1 bg-black hover:bg-stone-800 text-stone-400 hover:text-white rounded text-xs transition-colors border border-stone-800"
          >
            <Plus size={12} /> Objective
          </button>
          <div className="text-stone-500 group-hover:text-stone-300 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-800/80 bg-black/50"
          >
            <div className="p-3 sm:p-4 ml-2 sm:ml-6 space-y-2">
              {objectives.length === 0 ? (
                <div className="text-xs text-stone-500 py-2">No objectives. Add one to track progress.</div>
              ) : (
                objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-3 group/obj">
                    <button 
                      onClick={() => toggleObjective(idx)}
                      className="mt-0.5 flex-shrink-0 transition-colors"
                    >
                      {obj.completed ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <Circle size={16} className="text-stone-600 hover:text-emerald-500/50" />
                      )}
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <input 
                        type="text"
                        value={obj.text}
                        onChange={(e) => updateObjectiveText(idx, e.target.value)}
                        className={`bg-transparent border-none outline-none w-full text-sm transition-colors ${obj.completed ? 'text-stone-500 line-through' : 'text-stone-300 focus:text-white'}`}
                      />
                      <button 
                        onClick={() => removeObjective(idx)}
                        className="p-1 text-stone-600 hover:text-rose-400 opacity-0 group-hover/obj:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              <button
                onClick={addObjective}
                className="sm:hidden flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300 mt-2 py-1"
              >
                <Plus size={14} /> Add Objective
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
