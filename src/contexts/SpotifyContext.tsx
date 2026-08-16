import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, updateDoc, getFirestore } from 'firebase/firestore';

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  timestamp: number;
}

interface NowPlaying {
  isPlaying: boolean;
  title: string;
  artist: string;
  albumArt: string;
}

interface SpotifyContextType {
  isConnected: boolean;
  nowPlaying: NowPlaying | null;
  connectSpotify: () => void;
  disconnectSpotify: () => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const db = getFirestore();

  // Listen to Firestore for tokens
  useEffect(() => {
    if (!profile?.id) {
      setTokens(null);
      setIsConnected(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', profile.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.spotifyTokens) {
          setTokens(data.spotifyTokens);
          setIsConnected(true);
        } else {
          setTokens(null);
          setIsConnected(false);
        }
      }
    });

    return () => unsub();
  }, [profile?.id, db]);

  // Handle postMessage from OAuth popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.includes('localhost') && !event.origin.endsWith('.run.app')) return;
      
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS' && profile?.id) {
        const newTokens = event.data.tokens;
        if (newTokens.access_token) {
          const spotifyTokens: SpotifyTokens = {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            expires_in: newTokens.expires_in,
            timestamp: Date.now(),
          };
          
          await updateDoc(doc(db, 'users', profile.id), {
            spotifyTokens
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profile?.id, db]);

  const getActiveToken = async () => {
    if (!tokens || !profile?.id) return null;
    const now = Date.now();
    const expiresAt = tokens.timestamp + (tokens.expires_in * 1000);
    
    if (now >= expiresAt - (5 * 60 * 1000)) {
      try {
        const res = await fetch('/api/auth/spotify/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: tokens.refresh_token })
        });
        
        if (!res.ok) throw new Error('Failed to refresh token');
        
        const newTokens = await res.json();
        
        const updatedTokens: SpotifyTokens = {
          ...tokens,
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
          timestamp: Date.now()
        };
        
        if (newTokens.refresh_token) {
          updatedTokens.refresh_token = newTokens.refresh_token;
        }
        
        await updateDoc(doc(db, 'users', profile.id), {
          spotifyTokens: updatedTokens
        });
        return newTokens.access_token;
      } catch (e) {
        console.error("Refresh failed:", e);
        return null;
      }
    }
    return tokens.access_token;
  };

  // Fetch Now Playing data
  useEffect(() => {
    if (!tokens || !profile?.id) return;

    let intervalId: NodeJS.Timeout;
    
    const fetchNowPlaying = async () => {
      try {
        const activeToken = await getActiveToken();
        if (!activeToken) return;

        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { 'Authorization': `Bearer ${activeToken}` }
        });

        if (res.status === 204) {
          setNowPlaying(null);
          return;
        }

        if (!res.ok) {
           if (res.status === 401) {
              console.log("Token invalid");
           }
           return;
        }

        const data = await res.json();
        
        if (data.item) {
          setNowPlaying({
            isPlaying: data.is_playing,
            title: data.item.name,
            artist: data.item.artists.map((a: any) => a.name).join(', '),
            albumArt: data.item.album.images[0]?.url || ''
          });
        } else {
          setNowPlaying(null);
        }
      } catch (err) {
        console.error("Error fetching now playing:", err);
      }
    };

    fetchNowPlaying();
    intervalId = setInterval(fetchNowPlaying, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [tokens, profile?.id, db]);

  const apiRequest = async (endpoint: string, method: string = 'POST') => {
    const token = await getActiveToken();
    if (!token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optimistically update isPlaying state for play/pause
      if (endpoint === 'play' && nowPlaying) setNowPlaying({...nowPlaying, isPlaying: true});
      if (endpoint === 'pause' && nowPlaying) setNowPlaying({...nowPlaying, isPlaying: false});
    } catch (e) {
      console.error(`Failed Spotify API ${endpoint}:`, e);
    }
  };

  const play = () => apiRequest('play', 'PUT');
  const pause = () => apiRequest('pause', 'PUT');
  const skipNext = () => apiRequest('next', 'POST');
  const skipPrevious = () => apiRequest('previous', 'POST');

  const connectSpotify = async () => {
    try {
      const redirectUri = window.location.origin + '/api/auth/spotify/callback';
      const res = await fetch(`/api/auth/spotify/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      const { url } = await res.json();
      
      const width = 450, height = 730;
      const left = (window.screen.width / 2) - (width / 2);
      const top = (window.screen.height / 2) - (height / 2);
      
      window.open(
        url,
        'Spotify',
        `menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=${width},height=${height},top=${top},left=${left}`
      );
    } catch (err) {
      console.error("Failed to connect Spotify:", err);
    }
  };

  const disconnectSpotify = async () => {
    if (!profile?.id) return;
    try {
      // Remove spotify tokens from firestore via FieldValue.delete() or simply setting to null
      await updateDoc(doc(db, 'users', profile.id), {
        spotifyTokens: null
      });
      setNowPlaying(null);
    } catch (err) {
      console.error("Failed to disconnect Spotify", err);
    }
  };

  return (
    <SpotifyContext.Provider value={{ isConnected, nowPlaying, connectSpotify, disconnectSpotify, play, pause, skipNext, skipPrevious }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) throw new Error('useSpotify must be used within a SpotifyProvider');
  return context;
};
