import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSpotify } from '../contexts/SpotifyContext';
import { SplashMessage } from '../components/SplashMessage';
import { SubjectManager } from '../components/SubjectManager';
import { TimetableManager } from '../components/TimetableManager';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { Flame, LogOut, Calendar, Book, Trophy, Moon, Sun, Music, Snowflake, Play, Pause, SkipBack, SkipForward, Star, Target, Zap, Timer as TimerIcon } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BADGE_DEFINITIONS, BadgeId } from '../lib/achievements';

const LEGACY_BADGE_MAP: Record<string, BadgeId> = {
  'Perfect Score': 'perfect_score',
  'First Mastery': 'first_mastery',
  '7-Day Streak': 'streak_7',
  '3-Day Streak': 'streak_3'
};

const ICONS = {
  Star,
  Target,
  Flame,
  Zap,
  Timer: TimerIcon
};

const BadgeDisplay: React.FC<{ badgeId: string }> = ({ badgeId }) => {
  // Handle legacy strings mapped to new badge IDs
  const normalizedId = LEGACY_BADGE_MAP[badgeId] || badgeId;
  const def = BADGE_DEFINITIONS[normalizedId as BadgeId];
  
  if (!def) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
        {badgeId}
      </span>
    );
  }
  
  const Icon = ICONS[def.icon as keyof typeof ICONS];
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-transform hover:scale-105 cursor-default ${def.color}`}
      title={def.description}
    >
      <Icon size={14} className="opacity-80" />
      <span>{def.name}</span>
    </div>
  );
};

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, nowPlaying, connectSpotify, disconnectSpotify, play, pause, skipNext, skipPrevious } = useSpotify();
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [savedPlaylist, setSavedPlaylist] = useState('');

  useEffect(() => {
    if (profile?.savedPlaylist) {
      setSavedPlaylist(profile.savedPlaylist);
    }
  }, [profile?.savedPlaylist]);

  const name = profile?.name || 'Chibote';

  const handleSavePlaylist = async () => {
    let url = spotifyUrl;
    if (url.includes('spotify.com/playlist/')) {
      const parts = url.split('playlist/');
      const idPart = parts[1].split('?')[0];
      url = `https://open.spotify.com/embed/playlist/${idPart}?utm_source=generator&theme=0`;
    }
    setSavedPlaylist(url);
    setSpotifyUrl('');
    
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        savedPlaylist: url
      });
    }
  };

  const clearPlaylist = async () => {
    setSavedPlaylist('');
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        savedPlaylist: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-white/20 dark:bg-black/20 transition-colors pb-20">
      <SplashMessage name={name} />
      
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif text-stone-900 dark:text-white">Hi, {name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-sm font-medium border border-rose-100 dark:border-rose-500/20">
                <Flame size={16} className={profile?.streakCount ? "fill-rose-500" : ""} />
                <span>{profile?.streakCount || 0}</span>
              </div>
              {profile?.streakFreezes ? (
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-500/20" title="Streak Freeze Active">
                  <Snowflake size={16} className="fill-blue-400" />
                  <span>{profile.streakFreezes}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={signOut}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Study Area */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-yellow-400 dark:bg-yellow-500 rounded-3xl p-5 md:p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <Book size={20} className="text-stone-600 dark:text-stone-300" />
                  Subjects
                </h2>
              </div>
              <SubjectManager />
            </section>
            
            <section className="bg-fuchsia-400 dark:bg-fuchsia-500 rounded-3xl p-5 md:p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <Music size={20} className="text-stone-600 dark:text-stone-300" />
                  Study Music
                </h2>
                {isConnected && (
                  <button onClick={disconnectSpotify} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                    Disconnect Spotify
                  </button>
                )}
              </div>
              
              {!isConnected ? (
                <div className="text-center py-8 bg-white/20 dark:bg-black/20 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music size={24} />
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 mb-4 text-sm max-w-xs mx-auto">Connect your Spotify account to see what's playing while you study.</p>
                  <button
                    onClick={connectSpotify}
                    className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-white font-medium rounded-full transition-colors inline-flex items-center gap-2"
                  >
                    Connect Spotify
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Now Playing Widget */}
                  {nowPlaying ? (
                    <div className="flex flex-col gap-4 bg-white/20 dark:bg-black/20 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-4">
                        {nowPlaying.albumArt ? (
                          <img src={nowPlaying.albumArt} alt="Album art" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                            <Music size={24} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2.5 w-2.5">
                              {nowPlaying.isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${nowPlaying.isPlaying ? 'bg-green-500' : 'bg-stone-400'}`}></span>
                            </span>
                            <span className="text-xs font-semibold text-green-600 dark:text-green-500 tracking-wider uppercase">
                              Now Playing
                            </span>
                          </div>
                          <p className="font-medium text-stone-900 dark:text-white truncate">{nowPlaying.title}</p>
                          <p className="text-sm text-stone-700 dark:text-stone-300 truncate">{nowPlaying.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-1">
                         <button onClick={skipPrevious} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                           <SkipBack size={20} className="fill-current" />
                         </button>
                         <button onClick={nowPlaying.isPlaying ? pause : play} className="w-10 h-10 flex items-center justify-center bg-purple-600 dark:bg-purple-500 text-white dark:text-white rounded-full hover:scale-105 transition-transform">
                           {nowPlaying.isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
                         </button>
                         <button onClick={skipNext} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                           <SkipForward size={20} className="fill-current" />
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/20 dark:bg-black/20 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center gap-3 text-stone-700 dark:text-stone-300 text-sm">
                      <Music size={18} />
                      Not playing anything right now
                    </div>
                  )}

                  {/* Playlist Embed */}
                  <div>
                    {!savedPlaylist ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={spotifyUrl}
                          onChange={(e) => setSpotifyUrl(e.target.value)}
                          placeholder="Paste a Spotify Playlist URL..."
                          className="flex-1 bg-white/20 dark:bg-black/20 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 outline-none focus:border-stone-300 dark:focus:border-stone-700 text-stone-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={handleSavePlaylist}
                          disabled={!spotifyUrl}
                          className="px-5 py-3 bg-purple-600 dark:bg-purple-500 text-white dark:text-white font-medium rounded-xl disabled:opacity-50 text-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <iframe 
                          style={{ borderRadius: '12px' }} 
                          src={savedPlaylist} 
                          width="100%" 
                          height="152" 
                          frameBorder="0" 
                          allowFullScreen 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          loading="lazy"
                        />
                        <button 
                          onClick={() => setSavedPlaylist('')}
                          className="text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        >
                          Change Playlist
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PomodoroTimer />
            
            <section className="bg-purple-400 dark:bg-purple-500 rounded-3xl p-5 md:p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} className="text-stone-600 dark:text-stone-300" />
                  Your Schedule
                </h2>
              </div>
              <TimetableManager />
            </section>

            <section className="bg-pink-400 dark:bg-pink-500 rounded-3xl p-5 md:p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-colors">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-6">
                <Trophy size={20} className="text-stone-600 dark:text-stone-300" />
                Progress
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-white/20 dark:bg-black/20 rounded-2xl flex items-center justify-between border border-stone-100 dark:border-stone-800">
                  <span className="text-stone-800 dark:text-stone-200 font-medium">Total XP</span>
                  <span className="text-xl font-semibold text-stone-900 dark:text-white">{profile?.xp || 0}</span>
                </div>
                
                {profile?.badges && profile.badges.length > 0 && (
                     <div className="pt-2">
                     <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">Badges</h3>
                     <div className="flex flex-wrap gap-2">
                       {profile.badges.map((badge, idx) => (
                         <BadgeDisplay key={idx} badgeId={badge} />
                       ))}
                     </div>
                   </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
