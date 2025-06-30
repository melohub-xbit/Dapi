'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Target,
  Pause,
  Play
} from 'lucide-react';

interface GameWrapperProps {
  children: React.ReactNode;
  gameTitle: string;
  gameType: string;
  currentContent: {
    word?: string;
    sentence?: string;
    translation: string;
    type: 'vocabulary' | 'sentence';
  };
  sessionData: {
    currentIndex: number;
    totalItems: number;
    score: number;
    timeElapsed: number;
  };
  onBack: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export default function GameWrapper({
  children,
  gameTitle,
  gameType,
  currentContent,
  sessionData,
  onBack,
  onPause,
  onResume,
  isPaused = false
}: GameWrapperProps) {
  const [timeElapsed, setTimeElapsed] = useState(sessionData.timeElapsed);

  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (sessionData.currentIndex / sessionData.totalItems) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Game Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h2 className="text-xl font-bold text-white">{gameTitle}</h2>
                <p className="text-sm text-gray-400">
                  {currentContent.type === 'vocabulary' ? 'Vocabulary' : 'Sentence'} Practice
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Progress */}
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-white font-medium">
                  {sessionData.currentIndex + 1}/{sessionData.totalItems}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-medium">{sessionData.score}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-400" />
                <span className="text-white font-medium">{formatTime(timeElapsed)}</span>
              </div>

              {/* Pause/Resume */}
              {onPause && onResume && (
                <Button
                  onClick={isPaused ? onResume : onPause}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Lesson Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-6">
        {isPaused ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Card className="glass-effect border-gray-700/50">
              <CardContent className="p-12">
                <Pause className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Game Paused</h3>
                <p className="text-gray-400 mb-8">Take a break and resume when you're ready!</p>
                <Button
                  onClick={onResume}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Game
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Current Content Info */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge 
                variant={currentContent.type === 'vocabulary' ? 'default' : 'secondary'}
                className={currentContent.type === 'vocabulary' ? 'bg-blue-600' : 'bg-purple-600'}
              >
                {currentContent.type === 'vocabulary' ? 'Word' : 'Sentence'}
              </Badge>
              <div className="text-white">
                <span className="font-medium">
                  {currentContent.word || currentContent.sentence}
                </span>
                <span className="text-gray-400 ml-2">→ {currentContent.translation}</span>
              </div>
            </div>
            
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {gameType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}