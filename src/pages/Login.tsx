import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const { signIn } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/popup-blocked' || err.message?.includes('Cross-Origin')) {
        setError('Sign-in popup was blocked or restricted by the browser iframe. Please open the app in a new tab.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add it to your Firebase Authorized Domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in this Firebase project. Please enable it in the Firebase Console.');
      } else {
        setError(`An error occurred during sign in: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-950 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-rose-500/10 text-center space-y-8 border border-stone-800 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] transition-all duration-500"
      >
        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <BookOpen size={32} />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-serif text-white">Study Companion</h1>
          <p className="text-stone-400">Your personalized space to focus, learn, and grow.</p>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-900/50">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-200 text-black px-6 py-4 rounded-xl font-medium transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
