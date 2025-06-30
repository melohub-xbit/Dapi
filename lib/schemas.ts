import { ObjectId } from 'mongodb';

// ============================================================================
// SCENARIO SCHEMA (Contains Gemini JSON Data)
// ============================================================================
export interface Scenario {
  _id?: ObjectId;
  id: string; // Unique scenario identifier (used as reference)
  userEmail: string; // Reference to the user who owns this scenario

  // Gemini JSON structure (from lesson_Spanish_20250629_202324.json)
  metadata: {
    language: string;
    purpose: string;
    focus: string;
    generated_at: string;
    total_words: number;
    total_sentences: number;
  };

  vocabulary: VocabularyItem[];
  sentences: SentenceItem[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// VOCABULARY ITEM SCHEMA (Embedded in Scenario)
// ============================================================================
export interface VocabularyItem {
  id: string; // Hash from Gemini
  hash: string; // Hash from Gemini
  word: string;
  translation: string;
  phonetic: string;
  language: string;
}

// ============================================================================
// SENTENCE ITEM SCHEMA (Embedded in Scenario)
// ============================================================================
export interface SentenceItem {
  id: string; // Hash from Gemini
  hash: string; // Hash from Gemini
  sentence: string;
  translation: string;
  phonetic: string;
  language: string;
  difficulty: string;
}

// ============================================================================
// USER SCENARIO SCHEMA (Links Users to Scenarios)
// ============================================================================
export interface UserScenario {
  _id?: ObjectId;
  scenarioId: string; // Unique user scenario identifier
  
  userEmail: string; // User's email for easy lookup
  progress: number; // Percentage of scenario completed
  gamesWon: number;
  totalScore: number;
  lastPlayed: Date;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LESSON SCHEMA (Groups of vocabulary/sentences)
// ============================================================================
export interface Lesson {
  _id?: ObjectId;
  id: string; // Unique lesson identifier
  scenarioId: string; // Reference to Scenario
  userEmail: string; // User's email for easy lookup

  // Content references
  contentItems: LessonContentItem[]; // List of vocabulary/sentence references

  // Lesson metadata
  name?: string; // Optional lesson name
  order: number; // Order within scenario (1, 2, 3, etc.)
  score: number; // Lesson score (integer)

  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedDuration?: number;
  completed?: boolean;
  lastPlayedAt?: Date;
  bestScore?: number;
  totalAttempts?: number;
  description?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LESSON CONTENT ITEM SCHEMA (Embedded in Lesson)
// ============================================================================
export interface LessonContentItem {
  hash: string;                  // Reference to vocabulary/sentence hash in Scenario
  type: 'vocabulary' | 'sentence'; // Type of content
  order?: number;
  allowedGames: string[];
}

// ============================================================================
// COLLECTION NAMES
// ============================================================================
export const COLLECTIONS = {
  USERS: 'users',
  SCENARIOS: 'scenarios',
  USER_SCENARIOS: 'user_scenarios',
  LESSONS: 'lessons'
} as const;

// ============================================================================
// TYPE EXPORTS FOR API USAGE
// ============================================================================
export type CreateScenarioInput = Pick<Scenario, 'metadata' | 'vocabulary' | 'sentences'>;
export type CreateUserScenarioInput = Pick<UserScenario, 'userEmail' | 'scenarioId'>;
export type UpdateLessonInput = Partial<Pick<Lesson, 'name' | 'score' | 'contentItems'>>;

// Replace the existing CreateLessonInput with this:
export interface CreateLessonInput {
  userEmail: string;
  scenarioId: string;
  title: string;                 // This will map to 'name' in Lesson
  description?: string;
  contentItems: Array<{
    hash: string;
    type: 'vocabulary' | 'sentence';
    order: number;
    allowedGames: string[];
  }>;
  order: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  gameRestrictions?: {
    vocabularyGames: string[];
    sentenceGames: string[];
  };
}


// ============================================================================
// VALIDATION HELPERS
// ============================================================================
export const SUPPORTED_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Japanese', 'Korean', 'Chinese', 'Arabic', 'Russian'
] as const;

export const GAME_TYPES = [
  'mahjong', 'word-sprint', 'puzzle-builder', 'audio-catch'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export type GameType = typeof GAME_TYPES[number];


// Individual game performance within a lesson
export interface GamePerformance {
  gameType: 'mahjong' | 'word-sprint' | 'target-translation' | 'puzzle-builder' | 'audio-catch';
  contentType: 'vocabulary' | 'sentence';
  contentHash: string;
  contentText: string;
  
  // Core metrics (all games provide these)
  maxPossibleScore: number;
  actualScore: number;
  scorePercentage: number;
  totalAttempts: number;
  correctOnFirstTry: boolean;
  timeSpent: number; // in seconds
  
  // Game-specific metrics (only what each game naturally provides)
  gameMetrics: {
    // Mahjong specific
    matchingAccuracy?: number;        // correct matches / total attempts
    averageMatchTime?: number;        // average time per successful match
    totalMatches?: number;            // total successful matches
    
    // Word Sprint specific
    wordsPerMinute?: number;          // completion speed
    streakCount?: number;             // consecutive correct answers
    
    // Target Translation specific
    choiceAccuracy?: number;          // correct first choices / total questions
    averageChoiceTime?: number;       // time per question
    wrongChoicesBeforeCorrect?: number; // elimination attempts
    
    // Puzzle Builder specific
    constructionTime?: number;        // time to build sentence
    wordOrderAttempts?: number;       // attempts to get word order right
    
    // Audio Catch specific
    typingAccuracy?: number;          // typed correctly / total characters
    listeningAttempts?: number;       // how many times audio was replayed
  };
  
  timestamp: Date;
}


// Lesson-level performance aggregation
export interface LessonPerformance {
  _id?: ObjectId;
  id: string;
  lessonId: string;
  userEmail: string;
  scenarioId: string;
  lessonNumber: number;
  
  // Overall lesson metrics
  totalScore: number;
  maxPossibleScore: number;
  overallPercentage: number;
  totalTimeSpent: number; // in seconds
  completionDate: Date;
  
  // Content breakdown
  vocabularyPerformance: {
    totalWords: number;
    correctOnFirstTry: number;
    averageAttempts: number;
    averageScore: number;
    averageTimePerWord: number;
    strugglingWords: Array<{
      hash: string;
      word: string;
      translation: string;
      attempts: number;
      finalScore: number;
      timeSpent: number;
    }>;
  };
  
  sentencePerformance: {
    totalSentences: number;
    correctOnFirstTry: number;
    averageAttempts: number;
    averageScore: number;
    averageTimePerSentence: number;
    strugglingSentences: Array<{
      hash: string;
      sentence: string;
      translation: string;
      attempts: number;
      finalScore: number;
      timeSpent: number;
    }>;
  };
  
  // Game-specific performance summary
  gamePerformances: GamePerformance[];
  gameStats: {
    [gameType: string]: {
      totalPlayed: number;
      averageScore: number;
      averageTime: number;
      successRate: number; // percentage of first-try successes
    };
  };
  
  // Simple learning indicators
  learningIndicators: {
    fastestGame: string;
    slowestGame: string;
    highestScoringGame: string;
    mostAccurateGame: string;
    preferredContentType: 'vocabulary' | 'sentence' | 'mixed';
    overallTrend: 'strong' | 'average' | 'needs-practice';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// AI-generated feedback for each lesson
export interface LessonFeedback {
  _id?: ObjectId;
  id: string;
  userEmail: string;
  scenarioId: string;
  lessonId: string;
  lessonNumber: number;
  
  // Performance summary
  performanceSummary: {
    overallGrade: 'excellent' | 'good' | 'fair' | 'needs-improvement';
    scorePercentage: number;
    timeEfficiency: 'very-fast' | 'fast' | 'average' | 'slow';
    accuracyLevel: 'very-high' | 'high' | 'average' | 'low';
  };
  
  // AI-generated feedback sections
  feedback: {
    // Main feedback
    overallAnalysis: string;
    strengths: string[];
    areasForImprovement: string[];
    
    // Content-specific feedback
    vocabularyFeedback: string;
    sentenceFeedback: string;
    difficultWords: string[];
    
    // Game-specific insights
    bestGame: string;
    challengingGame: string;
    gameRecommendations: string[];
    
    // Actionable recommendations
    nextLessonFocus: string;
    practiceRecommendations: string[];
    motivationalMessage: string;
    
    // Progress context (if not first lesson)
    progressComparison?: string;
    improvementAreas?: string[];
  };
  
  // Metadata
  generatedAt: Date;
  geminiModel: string;
  createdAt: Date;
}

// User's cumulative progress across lessons
export interface UserProgress {
  _id?: ObjectId;
  id: string;
  userEmail: string;
  scenarioId: string;
  
  // Overall scenario progress
  totalLessonsCompleted: number;
  currentLesson: number;
  totalScore: number;
  totalMaxScore: number;
  overallPercentage: number;
  totalTimeSpent: number;
  
  // Lesson progression
  lessonHistory: Array<{
    lessonNumber: number;
    score: number;
    maxScore: number;
    percentage: number;
    timeSpent: number;
    completionDate: Date;
    grade: string;
  }>;
  
  // Content mastery (simplified)
  masteredContent: {
    vocabularyHashes: string[]; // words user consistently gets right
    sentenceHashes: string[];   // sentences user consistently gets right
  };
  
  strugglingContent: {
    vocabulary: Array<{
      hash: string;
      word: string;
      attempts: number;
      averageScore: number;
      lastAttemptDate: Date;
    }>;
    sentences: Array<{
      hash: string;
      sentence: string;
      attempts: number;
      averageScore: number;
      lastAttemptDate: Date;
    }>;
  };
  
  // Game preferences (based on performance)
  gamePreferences: {
    [gameType: string]: {
      totalPlayed: number;
      averageScore: number;
      averageTime: number;
      successRate: number;
      preferenceScore: number; // calculated based on performance
    };
  };
  
  // Simple progress indicators
  progressIndicators: {
    currentStreak: number; // consecutive lessons completed
    bestScore: number;
    averageScore: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    strongAreas: string[];
    weakAreas: string[];
  };
  
  lastUpdated: Date;
  createdAt: Date;
}

// Collection names
export const FEEDBACK_COLLECTIONS = {
  LESSON_PERFORMANCES: 'lesson_performances',
  LESSON_FEEDBACKS: 'lesson_feedbacks',
  USER_PROGRESS: 'user_progress',
} as const;

// Game scoring standards (0-100 scale)
export const GAME_SCORING = {
  PERFECT_SCORE: 100,
  FIRST_TRY_BONUS: 20,
  TIME_BONUS_MAX: 15,
  ATTEMPT_PENALTY: 10, // per additional attempt
  BASE_SCORE: 40, // minimum score for completion
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  MASTERY_SCORE: 80,        // score needed to consider content "mastered"
  STRUGGLING_SCORE: 50,     // score below which content is "struggling"
  FAST_TIME_PERCENTILE: 25, // top 25% of times considered "fast"
  SLOW_TIME_PERCENTILE: 75, // bottom 25% of times considered "slow"
  CONSISTENCY_THRESHOLD: 3, // attempts needed to establish consistency
} as const;
