'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Target,
  Gamepad2,
  Volume2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';

// Import game components
import MahjongGame from '@/components/games/MahjongGame';
import WordSprintGame from '@/components/games/WordSprintGame';
import TargetTranslationGame from '@/components/games/TargetTranslationGame';
import PuzzleBuilderGame from '@/components/games/PuzzleBuilderGame';
import AudioCatchGame from '@/components/games/AudioCatchGame';

interface GameContent {
  hash: string;
  type: 'vocabulary' | 'sentence';
  word?: string;
  sentence?: string;
  translation: string;
  phonetic: string;
  allowedGames: string[];
  order: number;
}

interface LessonData {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  gameContent: {
    vocabulary: GameContent[];
    sentences: GameContent[];
  };
  scenario: {
    metadata: {
      language: string;
    };
  };
}

export default function LessonLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [gameSession, setGameSession] = useState<any>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Combine and shuffle all content
  const [allContent, setAllContent] = useState<GameContent[]>([]);

  useEffect(() => {
    if (lesson) {
      const combined = [
        ...lesson.gameContent.vocabulary,
        ...lesson.gameContent.sentences
      ].sort((a, b) => a.order - b.order);
      setAllContent(combined);
    }
  }, [lesson]);

  useEffect(() => {
    if (user) {
      loadLesson();
      createGameSession();
    }
  }, [user]);

  const playAudio = async (text: string, language: string) => {
    setIsAudioLoading(true);
    try {
      const response = await fetch('/api/generateOrFetchAudio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text, language })
      });
      const data = await response.json();
      if (data.success) {
        const audio = new Audio(data.url);
        audio.play();
      } else {
        console.error('Failed to play audio:', data.error);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${params.lessonId}/gameplay`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLesson(data.lesson);
      } else {
        setError(data.error || 'Failed to load lesson');
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
      setError('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const createGameSession = async () => {
    try {
      const response = await fetch('/api/games/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lessonId: params.lessonId
        })
      });

      const data = await response.json();
      if (data.success) {
        setGameSession(data.session);
      }
    } catch (error) {
      console.error('Failed to create game session:', error);
    }
  };

  const selectAndLoadGame = async () => {
    if (!allContent[currentContentIndex] || !gameSession) return;

    setIsLoadingGame(true);
    const currentContent = allContent[currentContentIndex];

    try {
      const response = await fetch('/api/games/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lessonId: params.lessonId,
          contentHash: currentContent.hash,
          contentType: currentContent.type
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentGame(data.gameData);
      } else {
        setError(data.error || 'Failed to load game');
      }
    } catch (error) {
      console.error('Failed to select game:', error);
      setError('Failed to load game');
    } finally {
      setIsLoadingGame(false);
    }
  };

  const handleGameComplete = async (gameResults: any) => {
    if (!gameSession || !allContent[currentContentIndex]) return;

    const currentContent = allContent[currentContentIndex];

    try {
      // Submit game results
      await fetch('/api/games/session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: gameSession.id,
          gameResults: {
            gameType: currentGame.gameType,
            contentType: currentContent.type,
            contentHash: currentContent.hash,
            contentText: `${currentContent.word || currentContent.sentence} → ${currentContent.translation}`,
            ...gameResults
          }
        })
      });

      // Mark content as completed
      setCompletedContent(prev => new Set([...prev, currentContent.hash]));

      // Move to next content or complete lesson
      if (currentContentIndex < allContent.length - 1) {
        setCurrentContentIndex(prev => prev + 1);
        setCurrentGame(null);
      } else {
        // Lesson completed
        setLessonCompleted(true);
        await completeGameSession();
      }
    } catch (error) {
      console.error('Failed to submit game results:', error);
    }
  };

  const completeGameSession = async () => {
    try {
      await fetch(`/api/games/session/${gameSession.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Failed to complete game session:', error);
    }
  };

  const renderCurrentGame = () => {
    if (!currentGame) return null;

    const gameProps = {
      gameData: currentGame,
      onComplete: handleGameComplete,
      onBack: () => setCurrentGame(null)
    };

    switch (currentGame.gameType) {
      case 'mahjong':
        return <MahjongGame {...gameProps} />;
      case 'word-sprint':
        return <WordSprintGame {...gameProps} />;
      case 'target-translation':
        return <TargetTranslationGame {...gameProps} />;
      case 'puzzle-builder':
        return <PuzzleBuilderGame {...gameProps} />;
      case 'audio-catch':
        return <AudioCatchGame {...gameProps} />;
      default:
        return <div>Game not found</div>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Card className="glass-effect border-gray-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please log in to access lessons.</p>
            <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Card className="glass-effect border-red-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push(`/scenarios/${params.scenarioId}`)}>
                Back to Scenario
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentContent = allContent[currentContentIndex];
  const progressPercentage = (completedContent.size / allContent.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <Button
        onClick={() => router.push(`/scenarios/${params.scenarioId}`)}
        variant="glow"
        className="border-gray-600 text-gray-300 hover:bg-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Scenario
      </Button>

      {/* Lesson Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{lesson.name}</h1>
            <p className="text-gray-400">{lesson.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-gray-800">
              <Clock className="h-4 w-4 mr-1" />
              {Math.round(lesson.estimatedDuration / 60)}min
            </Badge>
            <Badge variant="secondary" className="bg-gray-800">
              {lesson.difficulty}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-400">{completedContent.size}/{allContent.length} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Lesson Completed State */}
      {lessonCompleted && (
        <Card className="glass-effect border-green-700/50 bg-green-900/10 mb-8">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-400 mb-4">¡Lesson Complete!</h2>
            <p className="text-gray-300 mb-6">
              Great job! You've completed all {allContent.length} learning items in this lesson.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push(`/scenarios/${params.scenarioId}`)}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Back to Scenario
              </Button>
              <Button
                variant="glow"
                onClick={() => window.location.reload()}
                className="border-gray-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Game Display */}
      {currentGame && !lessonCompleted && (
        <div className="mb-8">
          {renderCurrentGame()}
        </div>
      )}

      {/* Content Selection/Preview */}
      {!currentGame && !lessonCompleted && currentContent && (
        <Card className="glass-effect border-gray-700/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Gamepad2 className="h-6 w-6 mr-2 text-purple-400" />
                Ready for Next Challenge
              </div>
              <Badge variant="secondary" className="bg-gray-800">
                {currentContentIndex + 1} of {allContent.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Content Preview */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge 
                  variant={currentContent.type === 'vocabulary' ? 'default' : 'secondary'}
                  className={currentContent.type === 'vocabulary' ? 'bg-blue-600' : 'bg-purple-600'}
                >
                  {currentContent.type === 'vocabulary' ? 'Vocabulary' : 'Sentence'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => playAudio(currentContent.word || currentContent.sentence, lesson.scenario.metadata.language)}
                  disabled={isAudioLoading}
                >
                  {isAudioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="text-2xl font-bold text-white">
                  {currentContent.word || currentContent.sentence}
                </div>
                <div className="text-lg text-gray-300">
                  {currentContent.translation}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  [{currentContent.phonetic}]
                </div>
              </div>
            </div>

            {/* Available Games */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Available Games:</h4>
              <div className="flex flex-wrap gap-2">
                {currentContent.allowedGames.map(game => (
                  <Badge key={game} variant="glow" className="border-gray-600">
                    {game.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Start Game Button */}
            <Button
              onClick={selectAndLoadGame}
              disabled={isLoadingGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isLoadingGame ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading Game...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Learning Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Overview */}
      <Card className="glass-effect border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-6 w-6 mr-2 text-cyan-400" />
            Lesson Content Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vocabulary Section */}
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <Badge variant="default" className="bg-blue-600 mr-2">
                  Vocabulary
                </Badge>
                {lesson.gameContent.vocabulary.length} words
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lesson.gameContent.vocabulary.map((vocab, index) => (
                  <div
                    key={vocab.hash}
                    className={`p-3 rounded-lg border ${
                      completedContent.has(vocab.hash)
                        ? 'bg-green-900/20 border-green-700/50'
                        : currentContent?.hash === vocab.hash
                        ? 'bg-purple-900/20 border-purple-700/50'
                        : 'bg-gray-800/30 border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{vocab.word}</div>
                        <div className="text-sm text-gray-400">{vocab.translation}</div>
                      </div>
                      {completedContent.has(vocab.hash) && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {currentContent?.hash === vocab.hash && (
                        <ArrowRight className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentences Section */}
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <Badge variant="secondary" className="bg-purple-600 mr-2">
                  Sentences
                </Badge>
                {lesson.gameContent.sentences.length} sentences
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lesson.gameContent.sentences.map((sentence, index) => (
                  <div
                    key={sentence.hash}
                    className={`p-3 rounded-lg border ${
                      completedContent.has(sentence.hash)
                        ? 'bg-green-900/20 border-green-700/50'
                        : currentContent?.hash === sentence.hash
                        ? 'bg-purple-900/20 border-purple-700/50'
                        : 'bg-gray-800/30 border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white text-sm">{sentence.sentence}</div>
                        <div className="text-xs text-gray-400">{sentence.translation}</div>
                      </div>
                      {completedContent.has(sentence.hash) && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {currentContent?.hash === sentence.hash && (
                        <ArrowRight className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

