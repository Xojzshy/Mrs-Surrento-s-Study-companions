import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Zap, Trophy, ArrowRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Topic } from '../types';
import confetti from 'canvas-confetti';

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

export function LightningRound({ topic, onComplete }: { topic: Topic; onComplete: () => void }) {
  const { user, profile, recordStudyActivity } = useAuth();
  const quiz: Quiz[] = topic.cachedMaterial?.quiz || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (quiz.length === 0) {
    return <div>No quiz available.</div>;
  }

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === quiz[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishRound();
    }
  };

  const finishRound = async () => {
    setShowResults(true);
    
    const isMastered = score >= Math.ceil(quiz.length / 2); // basic logic for passing
    const isPerfect = score === quiz.length;
    
    // Record the activity for streak tracking and potential achievements
    if (isPerfect) {
      await recordStudyActivity('perfect_score');
    } else if (isMastered) {
      await recordStudyActivity('mastery');
    } else {
      await recordStudyActivity();
    }
    
    // Save to DB
    
    if (isMastered) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    if (user && profile) {
      const newXp = profile.xp + (isMastered ? 100 : 20);

      if (isMastered) {
        await updateDoc(doc(db, 'topics', topic.id), { status: 'mastered' });
      }
      
      await updateDoc(doc(db, 'users', user.uid), { 
        xp: newXp
      });
    }
  };

    if (showResults) {
    const isMastered = score >= Math.ceil(quiz.length / 2);
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
      >
        <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden transition-colors">
          {isMastered && (
            <div className="absolute inset-0 bg-amber-400/20 dark:bg-amber-500/10 z-0 animate-pulse" />
          )}
          <div className="relative z-10">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isMastered ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'}`}>
              <Trophy size={40} />
            </div>
            <h2 className="text-3xl font-serif text-stone-800 dark:text-stone-100 mb-2">
              {isMastered ? 'Brilliant!' : 'Good effort!'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8">
              You scored {score} out of {quiz.length}.
              {isMastered ? ' You mastered this topic!' : ' Review the material and try again.'}
            </p>
            <button
              onClick={onComplete}
              className="w-full py-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-medium transition-colors"
            >
              Back to Path
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQ = quiz[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-stone-50 dark:bg-stone-950 transition-colors"
    >
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 h-16 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-500">
          <Zap size={20} className="fill-amber-500" /> Lightning Round
        </div>
        <div className="text-stone-400 dark:text-stone-500 font-medium text-sm">
          {currentIndex + 1} of {quiz.length}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col justify-center">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-serif text-stone-800 dark:text-stone-100 leading-tight">
            {currentQ.question}
          </h2>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, i) => {
            let stateStyle = "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300";
            if (isAnswered) {
              if (i === currentQ.correctIndex) {
                stateStyle = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
              } else if (i === selectedOption) {
                stateStyle = "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400";
              } else {
                stateStyle = "bg-stone-50 dark:bg-stone-950 border-stone-100 dark:border-stone-900 text-stone-400 dark:text-stone-600 opacity-50";
              }
            } else if (i === selectedOption) {
              stateStyle = "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100";
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium ${stateStyle} flex justify-between items-center`}
              >
                <span>{opt}</span>
                {isAnswered && i === currentQ.correctIndex && <CheckCircle className="text-emerald-500" />}
                {isAnswered && i === selectedOption && i !== currentQ.correctIndex && <XCircle className="text-rose-500" />}
              </button>
            );
          })}
        </div>
      </main>

      {isAnswered && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 transition-colors"
        >
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <span className={`font-medium ${selectedOption === currentQ.correctIndex ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {selectedOption === currentQ.correctIndex ? 'Correct!' : 'Not quite.'}
            </span>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3.5 sm:py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors"
            >
              {currentIndex < quiz.length - 1 ? 'Next Question' : 'Finish'}
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
