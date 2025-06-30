'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trophy, ArrowLeft } from 'lucide-react';

interface MahjongGameProps {
  gameData: any;
  onComplete: (gameResults: any) => Promise<void>;
  onBack: () => void;
}

interface Tile {
  id: string;
  content: string;
  type: 'source' | 'translation';
  matchId: string;
  isFlipped: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

export default function MahjongGame({ gameData, onComplete, onBack }: MahjongGameProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedTiles, setFlippedTiles] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (gameData?.lessonContent) {
      initializeGame();
    }
  }, [gameData]);

  useEffect(() => {
    if (!gameComplete && startTime) {
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameComplete, startTime]);

  const initializeGame = () => {
    if (!gameData?.lessonContent) {
      console.error('No lesson content available');
      return;
    }

    // Create vocabulary pairs from lesson content
    const contentItems: any[] = [];
    
    // Add vocabulary items
    if (gameData.lessonContent.vocabulary) {
      contentItems.push(...gameData.lessonContent.vocabulary.slice(0, 6)); // Max 6 pairs
    }
    
    // If not enough vocabulary, add sentences
    if (contentItems.length < 6 && gameData.lessonContent.sentences) {
      const needed = 6 - contentItems.length;
      contentItems.push(...gameData.lessonContent.sentences.slice(0, needed));
    }

    if (contentItems.length === 0) {
      console.error('No content items available for game');
      return;
    }

    const gameTiles: Tile[] = [];

    contentItems.forEach((item) => {
      const sourceText = item.word || item.sentence;
      const translationText = item.translation;

      if (!sourceText || !translationText) {
        console.warn('Skipping item with missing text:', item);
        return;
      }

      // Source language tile
      gameTiles.push({
        id: `source-${item.hash}`,
        content: sourceText,
        type: 'source',
        matchId: item.hash,
        isFlipped: false,
        isMatched: false,
        isWrong: false,
      });

      // Translation tile
      gameTiles.push({
        id: `translation-${item.hash}`,
        content: translationText,
        type: 'translation',
        matchId: item.hash,
        isFlipped: false,
        isMatched: false,
        isWrong: false,
      });
    });

    // Shuffle tiles
    const shuffledTiles = gameTiles.sort(() => Math.random() - 0.5);
    setTiles(shuffledTiles);
    setTotalPairs(contentItems.length);
    setFlippedTiles([]);
    setScore(0);
    setMatches(0);
    setAttempts(0);
    setGameComplete(false);
    setTimeElapsed(0);
    setStartTime(new Date());
  };

  const handleTileClick = (tileId: string) => {
    if (flippedTiles.length >= 2 || gameComplete) return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.isFlipped || tile.isMatched) return;

    const newFlippedTiles = [...flippedTiles, tileId];
    setFlippedTiles(newFlippedTiles);

    // Flip the tile
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isFlipped: true } : t
    ));

    if (newFlippedTiles.length === 2) {
      setAttempts(prev => prev + 1);
      
      const [firstTileId, secondTileId] = newFlippedTiles;
      const firstTile = tiles.find(t => t.id === firstTileId);
      const secondTile = tiles.find(t => t.id === secondTileId);

      if (firstTile && secondTile && firstTile.matchId === secondTile.matchId) {
        // Match found
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === firstTileId || t.id === secondTileId) 
              ? { ...t, isMatched: true, isWrong: false }
              : t
          ));
          setScore(prev => prev + 100);
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === totalPairs) {
              setGameComplete(true);
              completeGame(newMatches);
            }
            return newMatches;
          });
          setFlippedTiles([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === firstTileId || t.id === secondTileId) 
              ? { ...t, isWrong: true }
              : t
          ));
        }, 500);

        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === firstTileId || t.id === secondTileId) 
              ? { ...t, isFlipped: false, isWrong: false }
              : t
          ));
          setFlippedTiles([]);
        }, 1500);
      }
    }
  };

  const completeGame = async (finalMatches = matches) => {
    const finalScore = score + (finalMatches === totalPairs ? 200 : 0);
    const accuracy = Math.round((finalMatches / totalPairs) * 100);
    
    const results = {
      totalAttempts: attempts,
      correctOnFirstTry: attempts === totalPairs,
      timeSpent: timeElapsed,
      gameSpecificData: {
        matchingAccuracy: accuracy,
        averageMatchTime: timeElapsed / Math.max(finalMatches, 1),
        totalMatches: finalMatches,
        finalScore: finalScore
      }
    };

    try {
      await onComplete(results);
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <h2 className="text-3xl font-bold">🀄 Mahjong Vocabulary Match</h2>
          <div></div>
        </div>
        <p className="text-gray-400 mb-6">
          Match {gameData.lessonContext?.language || 'foreign'} words with their English meanings
        </p>
        
        <div className="flex justify-center gap-6 mb-6">
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Matches: {matches}/{totalPairs}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Time: {formatTime(timeElapsed)}
          </Badge>
          <Badge variant="secondary" className="bg-gray-800 text-white px-4 py-2">
            Attempts: {attempts}
          </Badge>
        </div>

        <Button
          onClick={initializeGame}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          New Game
        </Button>
      </div>

      {gameComplete && (
        <div className="text-center mb-8 p-6 bg-green-900/20 border border-green-700 rounded-lg">
          <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-400 mb-2">¡Felicidades!</h3>
          <p className="text-gray-300">
            You completed the game in {formatTime(timeElapsed)} with {attempts} attempts!
          </p>
          <p className="text-gray-300">
            Final Score: {score + (matches === totalPairs ? 200 : 0)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Card
            key={tile.id}
            className={`
              cursor-pointer transition-all duration-300 transform hover:scale-105
              ${tile.isMatched 
                ? 'bg-green-800 border-green-600' 
                : tile.isWrong 
                  ? 'bg-red-800 border-red-600'
                  : tile.isFlipped 
                    ? 'bg-blue-800 border-blue-600' 
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }
            `}
            onClick={() => handleTileClick(tile.id)}
          >
            <CardContent className="p-4 h-24 flex items-center justify-center">
              {tile.isFlipped || tile.isMatched ? (
                <div className="text-center">
                  <div className={`text-sm font-medium ${
                    tile.type === 'source' ? 'text-blue-300' : 'text-green-300'
                  }`}>
                    {tile.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {tile.type === 'source' ? gameData.lessonContext?.language?.substring(0, 2).toUpperCase() : 'EN'}
                  </div>
                </div>
              ) : (
                <div className="text-4xl">🀄</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
