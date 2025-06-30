'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, Shuffle } from 'lucide-react';

interface PuzzleBuilderGameProps {
  gameData: any;
  onComplete: (gameResults: any) => Promise<void>;
  onBack: () => void;
}

interface WordPiece {
  id: string;
  word: string;
  correctPosition: number;
  currentPosition: number | null;
  isPlaced: boolean;
}

interface Sentence {
  hash: string;
  sentence: string;
  translation: string;
  words: string[];
}

export default function PuzzleBuilderGame({ gameData, onComplete, onBack }: PuzzleBuilderGameProps) {
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [wordPieces, setWordPieces] = useState<WordPiece[]>([]);
  const [placedWords, setPlacedWords] = useState<(WordPiece | null)[]>([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameStats, setGameStats] = useState({ correct: 0, total: 0 });
  const [sentencePool, setSentencePool] = useState<Sentence[]>([]);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (gameData?.lessonContent) {
      initializeGame();
    }
  }, [gameData]);

  const initializeGame = () => {
    if (!gameData?.lessonContent?.sentences) return;

    // Create sentence pool
    const sentences: Sentence[] = gameData.lessonContent.sentences.map((s: any) => ({
      hash: s.hash,
      sentence: s.sentence,
      translation: s.translation,
      words: s.sentence.split(/\s+/).filter((word: string) => word.length > 0)
    }));

    setSentencePool(sentences);
    if (sentences.length > 0) {
      loadRandomSentence(sentences);
    }
  };

  const loadRandomSentence = (pool = sentencePool) => {
    if (pool.length === 0) return;

    const randomSentence = pool[Math.floor(Math.random() * pool.length)];
    setCurrentSentence(randomSentence);

    // Create word pieces
    const pieces: WordPiece[] = randomSentence.words.map((word, index) => ({
      id: `word-${index}`,
      word: word.replace(/[¿?¡!.,]/g, ''), // Clean punctuation for display
      correctPosition: index,
      currentPosition: null,
      isPlaced: false
    }));

    // Shuffle the pieces
    const shuffledPieces = [...pieces].sort(() => Math.random() - 0.5);
    setWordPieces(shuffledPieces);
    setPlacedWords(new Array(randomSentence.words.length).fill(null));
    setFeedback(null);
    setAttempts(0);
    setShowHint(false);
  };

  const handleWordDrop = (wordPiece: WordPiece, position: number) => {
    // Remove word from current position if it was placed
    if (wordPiece.currentPosition !== null) {
      setPlacedWords(prev => {
        const newPlaced = [...prev];
        newPlaced[wordPiece.currentPosition!] = null;
        return newPlaced;
      });
    }

    // Place word in new position
    setPlacedWords(prev => {
      const newPlaced = [...prev];
      // Remove any word currently in this position
      const existingWord = newPlaced[position];
      if (existingWord) {
        setWordPieces(prevPieces =>
          prevPieces.map(p =>
            p.id === existingWord.id
            ? { ...p, currentPosition: null, isPlaced: false }
            : p
        )
      );
    }
    newPlaced[position] = wordPiece;
    return newPlaced;
  });

  // Update word piece
  setWordPieces(prev =>
    prev.map(p =>
      p.id === wordPiece.id
        ? { ...p, currentPosition: position, isPlaced: true }
        : p
    )
  );
};

const handleWordReturn = (wordPiece: WordPiece) => {
  if (wordPiece.currentPosition === null) return;

  setPlacedWords(prev => {
    const newPlaced = [...prev];
    newPlaced[wordPiece.currentPosition!] = null;
    return newPlaced;
  });

  setWordPieces(prev =>
    prev.map(p =>
      p.id === wordPiece.id
        ? { ...p, currentPosition: null, isPlaced: false }
        : p
    )
  );
};

  const checkSentence = () => {
    if (!currentSentence || placedWords.some(word => word === null)) return;

    const isCorrect = placedWords.every((word, index) =>
      word && word.correctPosition === index
    );

    if (attempts === 0) { // Only count total on first attempt
      setGameStats(prev => ({
        ...prev,
        total: prev.total + 1
      }));
    }

    setAttempts(prev => prev + 1);

    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 20);
      if (attempts === 0) { // Correct on first try
        setGameStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      setTimeout(() => {
        if (gameStats.total >= 9) { // Complete after 10 sentences
          completeGame();
        } else {
          loadRandomSentence();
        }
      }, 2000);
    } else {
      setFeedback('incorrect');
      if (attempts >= 2) {
        setShowHint(true);
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
        constructionTime: 0,
        wordOrderAttempts: attempts,
        accuracy: gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0
      }
    };

    await onComplete(results);
  };

  const shuffleWords = () => {
    const unplacedWords = wordPieces.filter(p => !p.isPlaced);
    const shuffled = [...unplacedWords].sort(() => Math.random() - 0.5);

    setWordPieces(prev => [
      ...prev.filter(p => p.isPlaced),
      ...shuffled
    ]);
  };

  if (!gameData?.lessonContent?.sentences) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">Error: No sentence data available for this game</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Loading game...</p>
          </CardContent>
        </Card>
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
          <h2 className="text-3xl font-bold">🧩 Puzzle Builder</h2>
          <div></div>
        </div>
        <p className="text-gray-400 mb-6">Arrange the words to build the correct sentence</p>

        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Sentence: {gameStats.total + 1}/10
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Accuracy: {gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0}%
          </Badge>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Build this sentence:</CardTitle>
          <p className="text-gray-300 text-lg">{currentSentence.translation}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zones */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 border-2 border-dashed border-gray-600 rounded-lg">
              {placedWords.map((word, index) => (
                <div
                  key={index}
                  className={`min-w-[80px] h-12 border-2 border-gray-500 rounded-lg flex items-center justify-center ${
                    word ? 'bg-blue-700 border-blue-500' : 'bg-gray-700'
                  }`}
                  onClick={() => word && handleWordReturn(word)}
                >
                  {word ? (
                    <span className="text-white font-medium cursor-pointer">
                      {word.word}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Drop here</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Word pieces */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Available Words:</h4>
              <Button
                onClick={shuffleWords}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-700/50 rounded-lg">
              {wordPieces.filter(piece => !piece.isPlaced).map((piece) => (
                <div
                  key={piece.id}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    // Find first empty position
                    const emptyIndex = placedWords.findIndex(word => word === null);
                    if (emptyIndex !== -1) {
                      handleWordDrop(piece, emptyIndex);
                    }
                  }}
                >
                  {piece.word}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={checkSentence}
              disabled={placedWords.some(word => word === null)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Check Sentence
            </Button>
            <Button
              onClick={() => loadRandomSentence()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Sentence
            </Button>
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
                  {feedback === 'correct' ? '¡Perfecto!' : 'Try again!'}
                </span>
              </div>

              {showHint && feedback === 'incorrect' && (
                <div className="mt-2">
                  <p className="text-yellow-400">
                    <strong>Hint:</strong> {currentSentence.sentence}
                  </p>
                </div>
              )}
            </div>
          )}

          {attempts > 0 && attempts < 3 && feedback === 'incorrect' && !showHint && (
            <p className="text-yellow-400 text-center">
              Attempt {attempts}/3 - Keep trying!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
);
}
