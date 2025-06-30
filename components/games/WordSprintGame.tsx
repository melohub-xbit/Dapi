'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';

interface WordSprintGameProps {
  gameData: any;
  onComplete: (gameResults: any) => Promise<void>;
  onBack: () => void;
}

interface SprintWord {
  hash: string;
  word: string;
  translation: string;
  phonetic: string;
  type: 'vocabulary' | 'sentence';
}

export default function WordSprintGame({ gameData, onComplete, onBack }: WordSprintGameProps) {
  const [currentWord, setCurrentWord] = useState<SprintWord | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameStats, setGameStats] = useState({ 
    correct: 0, 
    total: 0, 
    streak: 0, 
    maxStreak: 0 
  });
  const [wordPool, setWordPool] = useState<SprintWord[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    if (gameData?.lessonContent) {
      initializeGame();
    }
  }, [gameData]);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, gameActive]);

  const initializeGame = () => {
    if (!gameData?.lessonContent) return;

    // Create word pool from lesson content
    const words: SprintWord[] = [];
    
    // Add vocabulary items
    if (gameData.lessonContent.vocabulary) {
      gameData.lessonContent.vocabulary.forEach((vocab: any) => {
        words.push({
          hash: vocab.hash,
          word: vocab.word,
          translation: vocab.translation,
          phonetic: vocab.phonetic,
          type: 'vocabulary'
        });
      });
    }

    // Add sentence items (shorter ones for sprint)
    if (gameData.lessonContent.sentences) {
      gameData.lessonContent.sentences
        .filter((s: any) => s.sentence.length < 50) // Only shorter sentences
        .forEach((sentence: any) => {
          words.push({
            hash: sentence.hash,
            word: sentence.sentence,
            translation: sentence.translation,
            phonetic: sentence.phonetic,
            type: 'sentence'
          });
        });
    }

    setWordPool(words);
  };

  const startGame = () => {
    if (wordPool.length === 0) return;
    
    setGameActive(true);
    setTimeLeft(60);
    setScore(0);
    setGameStats({ correct: 0, total: 0, streak: 0, maxStreak: 0 });
    setUsedWords(new Set());
    setMultiplier(1);
    loadNewWord();
  };

  const loadNewWord = () => {
    if (wordPool.length === 0) return;

    // Try to get an unused word, or reset if all used
    let availableWords = wordPool.filter(w => !usedWords.has(w.hash));
    if (availableWords.length === 0) {
      setUsedWords(new Set());
      availableWords = wordPool;
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(randomWord);
    setUserInput('');
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!currentWord || !userInput.trim()) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = currentWord.translation.toLowerCase();
    
    // Check for exact match or close match
    const isCorrect = userAnswer === correctAnswer || 
                     userAnswer.replace(/[.,!?]/g, '') === correctAnswer.replace(/[.,!?]/g, '');

    setGameStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak)
      };
    });

    // Update multiplier based on streak
    if (isCorrect) {
      const newMultiplier = Math.min(Math.floor(gameStats.streak / 3) + 1, 5);
      setMultiplier(newMultiplier);
      setScore(prev => prev + (10 * newMultiplier));
      setFeedback('correct');
      setUsedWords(prev => new Set([...prev, currentWord.hash]));
    } else {
      setMultiplier(1);
      setFeedback('incorrect');
    }

    // Load next word after brief feedback
    setTimeout(() => {
      loadNewWord();
    }, isCorrect ? 800 : 1500);
  };

  const skipWord = () => {
    setGameStats(prev => ({ 
      ...prev, 
      total: prev.total + 1,
      streak: 0
    }));
    setMultiplier(1);
    loadNewWord();
  };

  const endGame = async () => {
    setGameActive(false);
    
    const results = {
      totalAttempts: gameStats.total,
      correctOnFirstTry: gameStats.maxStreak > 0,
      timeSpent: 60 - timeLeft,
      gameSpecificData: {
        finalScore: score,
        wordsPerMinute: Math.round(gameStats.correct / 1),
        streakCount: gameStats.maxStreak,
        accuracy: gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0
      }
    };

    await onComplete(results);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameActive) {
      checkAnswer();
    }
  };

  if (!gameData?.lessonContent) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">Error: No game data available</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-3xl font-bold">⚡ Word Sprint</h2>
          <div></div>
        </div>
        <p className="text-gray-400 mb-6">Translate as fast as you can in 60 seconds!</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            <Clock className="h-4 w-4 mr-1" />
            {timeLeft}s
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Streak: {gameStats.streak}
          </Badge>
          <Badge variant="secondary" className={`px-4 py-2 ${
            multiplier > 1 ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-white'
          }`}>
            <Zap className="h-4 w-4 mr-1" />
            {multiplier}x
          </Badge>
        </div>

        {!gameActive && (
          <Button
            onClick={startGame}
            disabled={wordPool.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Start Sprint
          </Button>
        )}
      </div>

      {gameActive && (
        <>
          <div className="mb-4">
            <Progress 
              value={(timeLeft / 60) * 100} 
              className="h-3"
            />
          </div>

          {currentWord && (
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge variant="outline" className="border-blue-500 text-blue-300">
                      {currentWord.type === 'vocabulary' ? 'Word' : 'Sentence'}
                    </Badge>
                    {gameData.lessonContext?.language}
                  </div>
                  <div className="text-3xl font-bold text-blue-300 mb-2">
                    {currentWord.word}
                  </div>
                  <div className="text-lg text-gray-400">
                    [{currentWord.phonetic}]
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type the English translation..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg"
                  onKeyPress={handleKeyPress}
                  disabled={feedback !== null}
                  autoFocus
                />

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={checkAnswer}
                    disabled={!userInput.trim() || feedback !== null}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit
                  </Button>
                  <Button
                    onClick={skipWord}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Skip
                  </Button>
                </div>

                {feedback && (
                  <div className={`p-4 rounded-lg text-center ${
                    feedback === 'correct' 
                      ? 'bg-green-900/20 border border-green-700' 
                      : 'bg-red-900/20 border border-red-700'
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {feedback === 'correct' ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                      <span className={`text-xl font-bold ${
                        feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                      </span>
                      {feedback === 'correct' && multiplier > 1 && (
                        <Badge className="bg-yellow-600 text-white ml-2">
                          +{10 * multiplier} points!
                        </Badge>
                      )}
                    </div>
                    
                    {feedback === 'incorrect' && (
                      <p className="text-white">
                        <strong>Correct answer:</strong> {currentWord.translation}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center text-sm text-gray-400">
                  <p>Words: {gameStats.correct}/{gameStats.total} • Max Streak: {gameStats.maxStreak}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!gameActive && gameStats.total > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Game Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{score}</div>
                <div className="text-sm text-gray-400">Final Score</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{gameStats.correct}</div>
                <div className="text-sm text-gray-400">Correct Words</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{gameStats.maxStreak}</div>
                <div className="text-sm text-gray-400">Best Streak</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
            
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
