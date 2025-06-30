'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, RotateCcw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface AudioCatchGameProps {
  gameData: any;
  onComplete: (gameResults: any) => Promise<void>;
  onBack: () => void;
}

interface AudioClip {
  hash: string;
  text: string;
  translation: string;
  phonetic: string;
  audioUrl?: string;
}

export default function AudioCatchGame({ gameData, onComplete, onBack }: AudioCatchGameProps) {
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStats, setGameStats] = useState({ correct: 0, total: 0 });
  const [contentPool, setContentPool] = useState<AudioClip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (gameData?.lessonContent) {
      initializeGame();
    }
  }, [gameData]);

  useEffect(() => {
    if (currentClip && !currentClip.phonetic) {
      fetchAndSetPhonetics(currentClip);
    }
  }, [currentClip]);

  const fetchAndSetPhonetics = async (clip: AudioClip) => {
    try {
      const response = await fetch('/api/getPhonetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: clip.text,
          lang: gameData.lessonContext?.language || 'english',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.phonetic) {
          const updatedClip = { ...clip, phonetic: data.phonetic };
          setCurrentClip(updatedClip);
          setContentPool((prevPool) =>
            prevPool.map((item) =>
              item.hash === clip.hash ? updatedClip : item
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch phonetics:', error);
    }
  };

  const initializeGame = () => {
    if (!gameData?.lessonContent) return;

    // Create content pool from lesson data
    const pool: AudioClip[] = [];
    
    // Add vocabulary items
    if (gameData.lessonContent.vocabulary) {
      gameData.lessonContent.vocabulary.forEach((vocab: any) => {
        pool.push({
          hash: vocab.hash,
          text: vocab.word,
          translation: vocab.translation,
          phonetic: vocab.phonetic,
          audioUrl: vocab.audioUrl
        });
      });
    }

    // Add sentence items
    if (gameData.lessonContent.sentences) {
      gameData.lessonContent.sentences.forEach((sentence: any) => {
        pool.push({
          hash: sentence.hash,
          text: sentence.sentence,
          translation: sentence.translation,
          phonetic: sentence.phonetic,
          audioUrl: sentence.audioUrl
        });
      });
    }

    setContentPool(pool);
    if (pool.length > 0) {
      loadRandomClip(pool);
    }
  };

  const loadRandomClip = (pool = contentPool) => {
    if (pool.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    const newClip = pool[randomIndex];
    setCurrentClip(newClip);
    setUserInput('');
    setFeedback(null);
    setShowAnswer(false);
    setAttempts(0);

    if (newClip && !newClip.phonetic) {
      fetchAndSetPhonetics(newClip);
    }
  };

  const playAudio = async () => {
    if (!currentClip) return;

    setIsPlaying(true);
    try {
      let audioUrl = currentClip.audioUrl;

      if (!audioUrl) {
        const response = await fetch('/api/generateOrFetchAudio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentClip.text,
            language: gameData.lessonContext?.language || 'english',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audio from API');
        }

        const data = await response.json();
        if (!data.url) {
          throw new Error('API did not return an audio URL');
        }
        audioUrl = data.url;

        // Update the clip in the component state and the pool
        const updatedClip = { ...currentClip, audioUrl };
        setCurrentClip(updatedClip);

        const updatedPool = contentPool.map((item) =>
          item.hash === currentClip.hash ? updatedClip : item
        );
        setContentPool(updatedPool);
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
        };
        await audio.play();
      } else {
        // If still no audio URL, stop playing state
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error in playAudio:', error);
      setIsPlaying(false);
      // Optionally, show a toast or message to the user
    }
  };

  const checkAnswer = () => {
    if (!currentClip || !userInput.trim()) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = currentClip.text.toLowerCase();
    
    // Simple similarity check
    const isCorrect = userAnswer === correctAnswer || 
                     userAnswer.replace(/[¿?¡!]/g, '') === correctAnswer.replace(/[¿?¡!]/g, '');

    setAttempts(prev => prev + 1);
    setGameStats(prev => ({ 
      correct: prev.correct + (isCorrect ? 1 : 0), 
      total: prev.total + 1 
    }));

    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 10);
      setTimeout(() => {
        if (gameStats.total >= 9) { // Complete after 10 questions
          completeGame();
        } else {
          loadRandomClip();
        }
      }, 2000);
    } else {
      setFeedback('incorrect');
      if (attempts >= 2) {
        setShowAnswer(true);
        setTimeout(() => {
          if (gameStats.total >= 9) {
            completeGame();
          } else {
            loadRandomClip();
          }
        }, 3000);
      }
    }
  };

  const completeGame = async () => {
    const results = {
      totalAttempts: gameStats.total,
      correctOnFirstTry: gameStats.correct === gameStats.total,
      timeSpent: 0, // Could add timer if needed
      gameSpecificData: {
        finalScore: score,
        typingAccuracy: gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0,
        listeningAttempts: attempts,
        totalQuestions: gameStats.total,
        correctAnswers: gameStats.correct
      }
    };

    await onComplete(results);
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

  if (!currentClip) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
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
          <h2 className="text-3xl font-bold">🎧 Audio Catch</h2>
          <div></div>
        </div>
        <p className="text-gray-400 mb-6">Listen to {gameData.lessonContext?.language} phrases and type what you hear</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Question: {gameStats.total + 1}/10
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Accuracy: {gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0}%
          </Badge>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Listen and Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Button
              onClick={playAudio}
              size="lg"
              disabled={isPlaying}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Volume2 className="h-6 w-6 mr-2" />
              {isPlaying ? 'Playing...' : 'Play Audio'}
            </Button>
            <p className="text-sm text-gray-400 mt-2">
              Pronunciation: {currentClip.phonetic}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Type what you hear in ${gameData.lessonContext?.language}...`}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
              disabled={feedback === 'correct' || showAnswer}
            />

            <div className="flex gap-2">
              <Button
                onClick={checkAnswer}
                disabled={!userInput.trim() || feedback === 'correct' || showAnswer}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Check Answer
              </Button>
              <Button
                onClick={() => loadRandomClip()}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Skip
              </Button>
            </div>
          </div>

          {feedback && (
            <div className={`p-4 rounded-lg ${
              feedback === 'correct' 
                ? 'bg-green-900/20 border border-green-700' 
                : 'bg-red-900/20 border border-red-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback === 'correct' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className={feedback === 'correct' ? 'text-green-400' : 'text-red-400'}>
                  {feedback === 'correct' ? '¡Correcto!' : 'Incorrect'}
                </span>
              </div>
              
              {showAnswer && (
                <div className="space-y-2">
                  <p className="text-white">
                    <strong>Correct answer:</strong> {currentClip.text}
                  </p>
                  <p className="text-gray-300">
                    <strong>English:</strong> {currentClip.translation}
                  </p>
                </div>
              )}
            </div>
          )}

          {attempts > 0 && attempts < 3 && feedback === 'incorrect' && !showAnswer && (
            <p className="text-yellow-400 text-center">
              Attempt {attempts}/3 - Try again!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
