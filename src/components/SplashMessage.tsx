import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const ENCOURAGEMENT_NOTES = [
  "You're going to crush it today.",
  "I believe in you more than you know.",
  "Take a deep breath. You've got this.",
  "Every small step counts. Keep going.",
  "You are incredibly smart and capable.",
  "Remember to drink water and take breaks!",
  "Thinking of you and cheering you on.",
  "Your dedication is truly inspiring.",
  "You make hard work look beautiful.",
  "Don't forget how far you've already come.",
  "I'm so proud of the woman you are.",
  "Even when it's hard, you are stronger.",
  "Focus mode: ON. You're a machine.",
  "I promise not to distract you... much.",
  "One more topic down, one step closer to conquering the world.",
  "Your brain is going to be so huge after this.",
  "Just imagine me giving you a high five right now.",
  "You're brilliant. Now go prove it to yourself.",
  "Sending you endless focus and a virtual hug.",
  "Coffee in hand, genius in mind. Let's go."
];

export function SplashMessage({ name }: { name?: string }) {
  const [isVisible, setIsVisible] = useState(true);
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    setNoteIndex(dayOfYear % ENCOURAGEMENT_NOTES.length);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsVisible(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()} // Prevent clicking inner modal from closing, but let button close it
            className="relative max-w-md w-full bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-[2rem] shadow-2xl text-center border border-stone-100 dark:border-stone-800 cursor-default"
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-4 pt-4 sm:pt-2">
              <h2 className="text-2xl font-serif text-stone-800 dark:text-stone-100 leading-tight">
                You're beautiful and I'm sorry I'm so far.
              </h2>
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                {ENCOURAGEMENT_NOTES[noteIndex]}
              </p>
              <div className="pt-6">
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-full font-medium transition-colors"
                >
                  Start Studying
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
