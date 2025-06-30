'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MessageCircle, 
  Gamepad2, 
  Trophy, 
  Target, 
  Calendar,
  TrendingUp,
  Sparkles,
  Play,
  Clock,
  Star,
  BookOpen,
  Type
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/auth/UserProfile';

interface DashboardProps {
  onStartConversation: (scenarios: any[]) => void;
  onCreateScenario: () => void;
  onPlayScenario: (scenario: any) => void;
}

interface DashboardStats {
  gamesWon: number;
  scenarios: number;
  totalScore: number;
  dayStreak: number;
  totalWords: number;
  totalSentences: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onStartConversation, 
  onCreateScenario, 
  onPlayScenario 
}) => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [scenariosResponse, statsResponse] = await Promise.all([
          fetch(`/api/scenarios?userEmail=${user.email}`),
          fetch(`/api/dashboard-stats?userEmail=${user.email}`),
        ]);

        if (!scenariosResponse.ok) {
          throw new Error('Failed to fetch scenarios');
        }
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch stats');
        }

        const scenariosData = await scenariosResponse.json();
        const statsData = await statsResponse.json();

        setScenarios(scenariosData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  const getLanguageFlag = (language: string) => {
    const flags: { [key: string]: string } = {
      'French': '🇫🇷',
      'Japanese': '🇯🇵',
      'German': '🇩🇪',
      'Spanish': '🇪🇸',
      'Italian': '🇮🇹',
      'Portuguese': '🇵🇹',
      'Russian': '🇷🇺',
      'Chinese': '🇨🇳',
      'Korean': '🇰🇷',
      'Arabic': '🇸🇦'
    };
    return flags[language] || '🌍';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800/50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-gray-400 mt-1">
                Ready to continue your language learning journey?
              </p>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 glow-purple h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">AI Conversation</CardTitle>
                    <CardDescription>Practice with your AI language partner</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Jump into realistic conversations tailored to your learning scenarios.
                </p>
                <Button 
                  onClick={() => onStartConversation(scenarios)}
                  variant="glow" 
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-effect border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-cyan-500/25 h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">New Scenario</CardTitle>
                    <CardDescription>Create a personalized learning path</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Tell us your goal and let AI create the perfect learning experience.
                </p>
                <Button 
                  onClick={onCreateScenario}
                  variant="outline" 
                  className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scenario
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.gamesWon || 0}</div>
              <div className="text-sm text-gray-400">Games Won</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.scenarios || 0}</div>
              <div className="text-sm text-gray-400">Scenarios</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <BookOpen className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.totalSentences || 0}</div>
              <div className="text-sm text-gray-400">Sentences</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <Type className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.totalWords || 0}</div>
              <div className="text-sm text-gray-400">Words</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.totalScore || 0}</div>
              <div className="text-sm text-gray-400">Total Score</div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-gray-700/50 text-center">
            <CardContent className="p-4">
              <Calendar className="h-8 w-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.dayStreak || 0}</div>
              <div className="text-sm text-gray-400">Day Streak</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scenarios Grid */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Learning Scenarios</h2>
          <Badge variant="glow">
            <Sparkles className="h-3 w-3 mr-1" />
            {scenarios.length} Active
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="glass-effect border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group hover:glow-purple h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getLanguageFlag(scenario.metadata.language)}</div>
                      <div>
                        <CardTitle className="text-white text-lg group-hover:gradient-text transition-all duration-300">
                          {scenario.metadata.purpose}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {scenario.metadata.language}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-gray-300 leading-relaxed">
                    {scenario.metadata.focus}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-purple-400 font-medium">{scenario.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scenario.progress || 0}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      {scenario.gamesPlayed || 0} games
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Star className="h-4 w-4 mr-2" />
                      {scenario.totalScore || 0} pts
                    </div>
                    {scenario.lastPlayed && (
                      <div className="flex items-center text-gray-400 col-span-2">
                        <Clock className="h-4 w-4 mr-2" />
                        Last played {new Date(scenario.lastPlayed).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onPlayScenario(scenario.id)}
                    variant="glow"
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;