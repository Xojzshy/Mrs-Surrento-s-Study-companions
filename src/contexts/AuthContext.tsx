import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { getNewAchievements } from '../lib/achievements';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  recordStudyActivity: (activityType?: 'focus' | 'mastery' | 'perfect_score') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const recordStudyActivity = async (activityType?: 'focus' | 'mastery' | 'perfect_score') => {
    if (!user || !profile) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let newStreak = profile.streakCount || 0;
    let newFreezes = profile.streakFreezes ?? 1;
    let isNewDay = false;
    
    if (profile.lastLoginDate !== todayStr) {
      isNewDay = true;
      if (profile.lastLoginDate) {
        const lastActivity = new Date(profile.lastLoginDate);
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const utcLast = Date.UTC(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
        const diffDays = Math.floor((utcToday - utcLast) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays === 2 && newFreezes > 0) {
          newStreak += 1;
          newFreezes -= 1; // used a freeze
        } else if (diffDays > 1) {
          newStreak = 1; // reset streak
        }
      } else {
        newStreak = 1;
      }
    }
    
    let currentBadges = profile.badges || [];
    let newlyUnlocked: string[] = [];
    
    if (isNewDay) {
      const streakBadges = getNewAchievements(currentBadges, { type: 'streak', streakCount: newStreak });
      newlyUnlocked = [...newlyUnlocked, ...streakBadges];
      currentBadges = [...currentBadges, ...streakBadges];
    }
    
    if (activityType) {
      const activityBadges = getNewAchievements(currentBadges, { type: activityType });
      newlyUnlocked = [...newlyUnlocked, ...activityBadges];
      currentBadges = [...currentBadges, ...activityBadges];
    }
    
    if (isNewDay || newlyUnlocked.length > 0) {
      const updates: Partial<UserProfile> = {
        lastLoginDate: todayStr,
        streakCount: newStreak,
        streakFreezes: newFreezes,
        badges: currentBadges
      };
      
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      setProfile({ ...profile, ...updates });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load or create profile
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userProfile: UserProfile;
        
        if (userSnap.exists()) {
          userProfile = userSnap.data() as UserProfile;
          
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          if (userProfile.lastLoginDate && userProfile.lastLoginDate !== todayStr) {
            const lastActivity = new Date(userProfile.lastLoginDate);
            const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const utcLast = Date.UTC(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
            const diffDays = Math.floor((utcToday - utcLast) / (1000 * 60 * 60 * 24));
            
            // Check if streak is dead
            if (diffDays > 1) {
              if (diffDays === 2 && (userProfile.streakFreezes || 0) > 0) {
                // Streak is protected by freeze, don't reset yet.
              } else {
                // Streak is lost
                const updates = { streakCount: 0 };
                await setDoc(userRef, updates, { merge: true });
                userProfile.streakCount = 0;
              }
            }
          }
        } else {
          userProfile = {
            name: currentUser.displayName?.split(' ')[0] || 'Chibote',
            streakCount: 0, // Starts at 0 until they do an activity
            streakFreezes: 1,
            badges: [],
            xp: 0
            // No lastLoginDate yet, it will be set on first activity
          };
          await setDoc(userRef, userProfile);
        }
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
