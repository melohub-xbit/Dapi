'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  Star,
  RotateCcw,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface GameResultsProps {
  session: {
    score: number;
    totalItems: number;
    timeElapsed: number;
    completedItems: string[];
  };
  onContinue: () => void;
  onRestart: () => void;
}

export default function GameResults({ session, onContinue, onRestart }: GameResultsProps) {
  const accuracy = Math.round((session.completedItems.length / session.totalItems) * 100);
  const averageTimePerItem = Math.round(session.timeElapsed / session.totalItems);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = () => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-400', stars: 3 };
    if (accuracy >= 75) return { level: 'Good', color: 'text-blue-400', stars: 2 };
    if (accuracy >= 60) return { level: 'Fair', color: 'text-yellow-400', stars: 1 };
    return { level: 'Keep Practicing', color: 'text-gray-400', stars: 0 };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Main Results Card */}
        <Card className="glass-effect border-gray-700/50 mb-6">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Lesson Complete!
              </CardTitle>
              <div className="flex justify-center space-x-1 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < performance.stars 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <Badge 
                variant="secondary" 
                className={`${performance.color} bg-gray-800 text-lg px-4 py-2`}
              >
                {performance.level}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{session.score}</div>
                <div className="text-gray-400 text-sm">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{accuracy}%</div>
                <div className="text-gray-400 text-sm">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {formatTime(session.timeElapsed)}
                </div>
                <div className="text-gray-400 text-sm">Total Time</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Items Completed</span>
                <span>{session.completedItems.length}/{session.totalItems}</span>
              </div>
              <Progress value={accuracy} className="h-3" />
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-white font-medium">Items Mastered</div>
                  <div className="text-gray-400 text-sm">
                    {session.completedItems.length} out of {session.totalItems}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-white font-medium">Avg. Time per Item</div>
                  <div className="text-gray-400 text-sm">{averageTimePerItem} seconds</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={onRestart}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice Again
              </Button>
              <Button
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card className="glass-effect border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Performance Insights</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              {accuracy >= 90 && (
                <p className="text-green-400">
                  🎉 Outstanding performance! You've mastered this content.
                </p>
              )}
              
              {accuracy >= 75 && accuracy < 90 && (
                <p className="text-blue-400">
                  👍 Good job! Consider reviewing the items you missed.
                </p>
              )}
              
              {accuracy >= 60 && accuracy < 75 && (
                <p className="text-yellow-400">
                  💪 You're getting there! Practice these items again to improve.
                </p>
              )}
              
              {accuracy < 60 && (
                <p className="text-gray-400">
                  📚 Keep practicing! Repetition is key to language learning.
                </p>
              )}
              
              {averageTimePerItem < 10 && (
                <p className="text-cyan-400">
                  ⚡ Great speed! You're developing quick recall.
                </p>
              )}
              
              {averageTimePerItem > 30 && (
                <p className="text-orange-400">
                  🐌 Take your time, but try to build up your speed with practice.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}