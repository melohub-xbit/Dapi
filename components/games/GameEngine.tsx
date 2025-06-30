'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameWrapper from './GameWrapper';
import MahjongGame from './MahjongGame';
import WordSprintGame from './WordSprintGame';
import TargetTranslationGame from './TargetTranslationGame';
import PuzzleBuilderGame from './PuzzleBuilderGame';
import AudioCatchGame from './AudioCatchGame';
import GameResults from './GameResults';

interface GameEngineProps {
  lessonId: string;
  scenarioId: string;
  onComplete: () => void;
}

interface GameSession {
  id: string;
  currentIndex: number;
  totalItems: number;
  score: number;
  timeElapsed: number;
  completedItems: string[];
  currentGame: any;
  allContent: any[];
}

export default function GameEngine({ lessonId, scenarioId, onComplete }: GameEngineProps) {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    initializeGameSession();
  }, [lessonId]);

  const initializeGameSession = async () => {
    try {
      // Create game session
      const sessionResponse = await fetch('/api/games/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lessonId })
      });

      const sessionData = await sessionResponse.json();
      if (!sessionData.success) throw new Error('Failed to create session');

      // Get lesson content
      const lessonResponse = await fetch(`/api/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const lessonData = await lessonResponse.json();
      if (!lessonData.success) throw new Error('Failed to load lesson');

      // Combine and shuffle content
      const allContent = [
        ...lessonData.lesson.gameContent.vocabulary.map((item: any) => ({
          ...item,
          type: 'vocabulary'
        })),
        ...lessonData.lesson.gameContent.sentences.map((item: any) => ({
          ...item,
          type: 'sentence'
        }))
      ].sort(() => Math.random() - 0.5);

      // Load first game
      const firstGame = await selectGameForContent(allContent[0]);

      setSession({
        id: sessionData.session.id,
        currentIndex: 0,
        totalItems: allContent.length,
        score: 0,
        timeElapsed: 0,
        completedItems: [],
        currentGame: firstGame,
        allContent
      });

    } catch (error) {
      console.error('Failed to initialize game session:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectGameForContent = async (content: any) => {
    try {
      const response = await fetch('/api/games/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lessonId,
          contentHash: content.hash,
          contentType: content.type
        })
      });

      const data = await response.json();
      return data.success ? data.gameData : null;
    } catch (error) {
      console.error('Failed to select game:', error);
      return null;
    }
  };

  const handleGameComplete = async (gameResults: any) => {
    if (!session) return;

    const currentContent = session.allContent[session.currentIndex];
    
    // Submit game results
    await fetch('/api/games/session', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        sessionId: session.id,
        gameResults: {
          gameType: session.currentGame.gameType,
          contentType: currentContent.type,
          contentHash: currentContent.hash,
          contentText: `${currentContent.word || currentContent.sentence} → ${currentContent.translation}`,
          ...gameResults
        }
      })
    });

    // Update session
    const newScore = session.score + (gameResults.score || 0);
    const newCompletedItems = [...session.completedItems, currentContent.hash];
    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.totalItems) {
      // Lesson complete
      await completeSession();
      setShowResults(true);
    } else {
      // Load next game
      const nextContent = session.allContent[nextIndex];
      const nextGame = await selectGameForContent(nextContent);

      setSession({
        ...session,
        currentIndex: nextIndex,
        score: newScore,
        completedItems: newCompletedItems,
        currentGame: nextGame
      });
    }
  };

  const completeSession = async () => {
    if (!session) return;

    await fetch(`/api/games/session/${session.id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  };

  const handleBack = () => {
    router.push(`/scenarios/${scenarioId}`);
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  if (showResults && session) {
    return (
      <GameResults
        session={session}
        onContinue={onComplete}
        onRestart={initializeGameSession}
      />
    );
  }

  if (!session || !session.currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load game session</p>
          <button onClick={handleBack} className="mt-4 text-blue-400 hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentContent = session.allContent[session.currentIndex];
  const gameProps = {
    gameData: session.currentGame,
    onComplete: handleGameComplete,
    onBack: handleBack
  };

  const renderGame = () => {
    switch (session.currentGame.gameType) {
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
          return <div className="text-center text-red-400">Unknown game type</div>;
      }
    };
  
    return (
      <GameWrapper
        gameTitle={session.currentGame.title || 'Learning Game'}
        gameType={session.currentGame.gameType}
        currentContent={currentContent}
        sessionData={{
          currentIndex: session.currentIndex,
          totalItems: session.totalItems,
          score: session.score,
          timeElapsed: session.timeElapsed
        }}
        onBack={handleBack}
        onPause={handlePause}
        onResume={handleResume}
        isPaused={isPaused}
      >
        {renderGame()}
      </GameWrapper>
    );
  }
  