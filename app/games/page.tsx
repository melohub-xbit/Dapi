'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

export default function GamesPage() {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get scenarioId from URL params
  const scenarioId = searchParams.get('scenarioId');
  const [scenario, setScenario] = useState<any>(null);

  // Redirect to landing if not authenticated
  React.useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch scenario data if scenarioId is present
  React.useEffect(() => {
    const fetchScenario = async () => {
      if (scenarioId && user?.email) {
        try {
          const response = await fetch(`/api/scenarios/${scenarioId}?userEmail=${user.email}`);
          if (!response.ok) {
            throw new Error('Failed to fetch scenario');
          }
          const data = await response.json();
          setScenario(data.scenario);
        } catch (err) {
          console.error('Error fetching scenario:', err);
          router.push('/dashboard'); // Redirect if scenario not found or error
        }
      } else if (!loading && !scenarioId) {
        router.push('/dashboard'); // Redirect if no scenarioId
      }
    };

    fetchScenario();
  }, [scenarioId, user, loading, router]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const games = [
    {
      id: 'mahjong',
      title: '🀄 Vocabulary Match',
      description: `Match ${scenario?.language || 'target'} words with their meanings`,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'audio-catch',
      title: '🎧 Audio Catch',
      description: 'Listen and type what you hear',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'word-sprint',
      title: '📝 Word Sprint',
      description: 'Translate as fast as you can',
      color: 'from-green-500 to-teal-500',
    },
    {
      id: 'target-translation',
      title: '🎯 Target Translation',
      description: 'Shoot the correct meaning',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'puzzle-builder',
      title: '🧩 Sentence Builder',
      description: 'Build perfect sentences',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading games...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !scenario) {
    return null; // Will redirect via useEffect
  }

  if (currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentGame(null)}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Playing: <span className="text-purple-400">{scenario.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                Player: <span className="text-cyan-400">{user?.username}</span>
              </div>
            </div>
          </div>
          
          {/* Game component would be rendered here based on currentGame */}
          <div className="glass-effect border border-purple-500/30 rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              {games.find(g => g.id === currentGame)?.title}
            </h2>
            <p className="text-gray-300 mb-8">
              Game implementation coming soon! This will be a fully interactive {currentGame} game 
              tailored to your "{scenario.name}" scenario.
            </p>
            <div className="space-y-4">
              <div className="text-lg text-purple-300">
                🎯 Context: {scenario.context}
              </div>
              <div className="text-lg text-cyan-300">
                🌍 Language: {scenario.language}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Playing as</div>
            <div className="text-purple-400 font-semibold">{user?.username}</div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            {scenario.name}
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            {scenario.context}
          </p>
          <div className="flex justify-center items-center space-x-4">
            <span className="text-2xl">{scenario.language === 'French' ? '🇫🇷' : scenario.language === 'Japanese' ? '🇯🇵' : '🇩🇪'}</span>
            <span className="text-purple-400 font-semibold">{scenario.language}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-effect border border-gray-700/50 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 group hover:glow-purple cursor-pointer h-full"
                   onClick={() => setCurrentGame(game.id)}>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${game.color} p-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:gradient-text transition-all duration-300">
                    {game.title}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {game.description}
                  </p>
                  <Button variant="outline" className="w-full">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Play Game
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
