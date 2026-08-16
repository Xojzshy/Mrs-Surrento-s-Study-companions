import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const { recordStudyActivity } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or notification here
      if (mode === 'focus') {
        recordStudyActivity('focus');
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, recordStudyActivity]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section className="bg-fuchsia-400 dark:bg-fuchsia-500 rounded-3xl p-5 md:p-6 shadow-sm border border-fuchsia-500 dark:border-fuchsia-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-900 flex items-center gap-2">
          <Timer size={20} className="text-stone-700 dark:text-stone-700" />
          Focus Timer
        </h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchMode('focus')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
            mode === 'focus'
              ? 'bg-yellow-400 dark:bg-yellow-500 text-stone-900'
              : 'text-white hover:bg-fuchsia-500 dark:hover:bg-fuchsia-600'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
            mode === 'break'
              ? 'bg-purple-600 dark:bg-purple-700 text-white'
              : 'text-white hover:bg-fuchsia-500 dark:hover:bg-fuchsia-600'
          }`}
        >
          Break
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="text-5xl font-mono text-stone-900 dark:text-stone-900 font-medium tabular-nums tracking-tight">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-colors ${
            isActive
              ? 'bg-yellow-400 dark:bg-yellow-500 text-stone-900 hover:bg-yellow-500 dark:hover:bg-yellow-600'
              : 'bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700'
          }`}
        >
          {isActive ? (
            <>
              <Pause size={18} /> Pause
            </>
          ) : (
            <>
              <Play size={18} /> Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 bg-pink-500 dark:bg-pink-600 text-white rounded-full hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </section>
  );
}
