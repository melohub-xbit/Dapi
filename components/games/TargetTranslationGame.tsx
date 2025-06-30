'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, RotateCcw, Trophy, Timer, ArrowLeft } from 'lucide-react';

interface TargetTranslationGameProps {
  gameData: any;
  onComplete: (gameResults: any) => Promise<void>;
  onBack: () => void;
}

interface Challenge {
  id: number;
  question: string;
  pronunciation: string;
  correctAnswer: string;
  options: string[];
  difficulty: string;
  points: number;
}

export default function TargetTranslationGame({ gameData, onComplete, onBack }: TargetTranslationGameProps) {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const [gameActive, setGameActive] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (gameData) {
      initializeGame();
    }
  }, [gameData]);

  useEffect(() => {
    if (gameActive && timeLeft > 0 && !feedback) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameActive && !feedback) {
      handleTimeout();
    }
  }, [gameActive, timeLeft, feedback]);

  const initializeGame = () => {
    if (!gameData?.lessonContent) {
      console.error('No lesson content available');
      return;
    }

    // Generate challenges from lesson content
    const generatedChallenges: Challenge[] = [];
    let challengeId = 1;

    // Add vocabulary challenges
    if (gameData.lessonContent.vocabulary) {
      gameData.lessonContent.vocabulary.forEach((vocab: any) => {
        const options = generateOptionsForContent(vocab, 'vocabulary');
        generatedChallenges.push({
          id: challengeId++,
          question: vocab.word,
          pronunciation: vocab.phonetic,
          correctAnswer: vocab.translation,
          options,
          difficulty: gameData.lessonContext?.difficulty || 'medium',
          points: 100
        });
      });
    }

    // Add sentence challenges
    if (gameData.lessonContent.sentences) {
      gameData.lessonContent.sentences.forEach((sentence: any) => {
        const options = generateOptionsForContent(sentence, 'sentence');
        generatedChallenges.push({
          id: challengeId++,
          question: sentence.sentence,
          pronunciation: sentence.phonetic,
          correctAnswer: sentence.translation,
          options,
          difficulty: gameData.lessonContext?.difficulty || 'medium',
          points: 150
        });
      });
    }

    // Shuffle challenges
    const shuffledChallenges = generatedChallenges.sort(() => Math.random() - 0.5);
    setChallenges(shuffledChallenges);
    
    if (shuffledChallenges.length > 0) {
      startGame(shuffledChallenges);
    }
  };

  const generateOptionsForContent = (content: any, type: 'vocabulary' | 'sentence'): string[] => {
    const options = [content.translation];
    
    // Get wrong answers from other content
    const otherContent = type === 'vocabulary' 
      ? gameData.lessonContent.vocabulary || []
      : gameData.lessonContent.sentences || [];
    
    const wrongAnswers = otherContent
      .filter((item: any) => item.hash !== content.hash)
      .map((item: any) => item.translation)
      .filter((translation: string) => translation !== content.translation)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    options.push(...wrongAnswers);

    // Fill with generic options if needed
    while (options.length < 4) {
      options.push(`Option ${options.length}`);
    }

    return options.sort(() => Math.random() - 0.5);
  };

  const startGame = (challengeList = challenges) => {
    if (challengeList.length === 0) return;
    
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setChallengeIndex(0);
    setStartTime(new Date());
    loadChallenge(0, challengeList);
  };

  const loadChallenge = (index: number, challengeList = challenges) => {
    if (index >= challengeList.length) {
      endGame();
      return;
    }

    const challenge = challengeList[index];
    setCurrentChallenge(challenge);
    setTimeLeft(8);
    setFeedback(null);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (!currentChallenge || feedback) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentChallenge.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      const points = currentChallenge.points + (streak > 0 ? Math.round(currentChallenge.points * 0.5) : 0);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      const nextIndex = challengeIndex + 1;
      setChallengeIndex(nextIndex);
      loadChallenge(nextIndex);
    }, 2000);
  };

  const handleTimeout = () => {
    setFeedback('incorrect');
    setStreak(0);
    setTimeout(() => {
      const nextIndex = challengeIndex + 1;
      setChallengeIndex(nextIndex);
      loadChallenge(nextIndex);
    }, 2000);
  };

  const endGame = async () => {
    setGameActive(false);
    
    const totalTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
    const results = {
      totalAttempts: challengeIndex,
      correctOnFirstTry: streak > 0,
      timeSpent: totalTime,
      gameSpecificData: {
        finalScore: score,
        challengesCompleted: challengeIndex,
        totalChallenges: challenges.length,
        accuracy: challengeIndex > 0 ? Math.round((score / (challengeIndex * 100)) * 100) : 0
      }
    };

    await onComplete(results);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-red-600';
      default: return 'bg-gray-600';
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

  if (!gameActive && challenges.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Target Translation</h3>
            <p className="text-gray-400 mb-6">Loading challenges...</p>
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
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
          <h2 className="text-3xl font-bold">🎯 Target Translation</h2>
          <div></div>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            <Timer className="h-4 w-4 mr-1" />
            {timeLeft}s
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Challenge: {challengeIndex + 1}/{challenges.length}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-600 text-white px-4 py-2">
            Streak: {streak}
          </Badge>
        </div>

        {!gameActive && challenges.length > 0 && (
          <Button
            onClick={() => startGame()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Target className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        )}
      </div>

      {/* Game Content */}
      {gameActive && currentChallenge && (
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <div className="text-center">
              <Badge 
                className={`${getDifficultyColor(currentChallenge.difficulty)} text-white mb-4`}
              >
                {currentChallenge.difficulty.toUpperCase()} • {currentChallenge.points} pts
              </Badge>
              <CardTitle className="text-white text-2xl mb-2">
                What does this mean in English?
              </CardTitle>
              <div className="text-4xl font-bold text-blue-300 mb-2">
                {currentChallenge.question}
              </div>
              <div className="text-lg text-gray-400">
                [{currentChallenge.pronunciation}]
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentChallenge.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={feedback !== null}
                  className={`
                    p-6 text-lg h-auto whitespace-normal
                    ${feedback === null 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
                      : selectedAnswer === option
                        ? option === currentChallenge.correctAnswer
                          ? 'bg-green-600 text-white border-green-500'
                          : 'bg-red-600 text-white border-red-500'
                        : option === currentChallenge.correctAnswer
                          ? 'bg-green-600 text-white border-green-500'
                          : 'bg-gray-700 text-gray-400 border-gray-600'
                    }
                  `}
                  variant="outline"
                >
                  {option}
                </Button>
              ))}
            </div>

            {feedback && (
              <div className={`mt-6 p-4 rounded-lg text-center ${
                feedback === 'correct' 
                  ? 'bg-green-900/20 border border-green-700' 
                  : 'bg-red-900/20 border border-red-700'
              }`}>
                <div className={`text-xl font-bold mb-2 ${
                  feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {feedback === 'correct' ? '🎉 Correct!' : '❌ Incorrect'}
                </div>
                {feedback === 'correct' && streak > 1 && (
                  <div className="text-yellow-400">
                    🔥 Streak: {streak}! Bonus points earned!
                  </div>
                )}
                {feedback === 'incorrect' && (
                  <div className="text-white">
                    The correct answer was: <strong>{currentChallenge.correctAnswer}</strong>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Complete */}
      {!gameActive && challengeIndex > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Game Complete!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{score}</div>
                <div className="text-sm text-gray-400">Final Score</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{challengeIndex}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{challenges.length}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {challengeIndex > 0 ? Math.round((score / (challengeIndex * 100)) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
            <Button
              onClick={() => startGame()}
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
