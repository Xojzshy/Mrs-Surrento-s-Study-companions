export interface UserProfile {
  name: string;
  themePrefs?: string;
  streakCount: number;
  streakFreezes?: number;
  badges?: string[];
  xp: number;
  lastLoginDate?: string;
  savedPlaylist?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  whyNote?: string;
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  day: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
  ownerId: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  status: 'locked' | 'unlocked' | 'mastered';
  cachedMaterial?: {
    summary: string;
    resources: { title: string; url: string }[];
    whyItMatters: string;
    quiz?: { question: string; options: string[]; correctIndex: number }[];
  };
  ownerId: string;
}

export interface LightningRound {
  id: string;
  topicId: string;
  questions: any[];
  score: number;
  completedAt: number;
  ownerId: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  order: number;
  ownerId: string;
}

export interface Objective {
  text: string;
  completed: boolean;
}

export interface CourseTopic {
  id: string;
  courseId: string;
  title: string;
  objectives: Objective[];
  order: number;
  ownerId: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  assessmentName: string;
  score: number;
  weight: number;
  date: string;
  ownerId: string;
}
