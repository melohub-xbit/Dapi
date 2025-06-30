'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  Trophy, 
  Clock, 
  Target,
  Volume2,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface Lesson {
  id: string;
  name: string;
  order: number;
  contentItems: Array<{
    hash: string;
    type: 'vocabulary' | 'sentence';
  }>;
  score: number;
  completed?: boolean;
}

interface ScenarioData {
  id: string;
  metadata: {
    language: string;
    purpose: string;
    focus: string;
    total_words: number;
    total_sentences: number;
  };
  lessons: Lesson[];
}

export default function ScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const scenarioId = params.scenarioId as string;

  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && scenarioId) {
      fetchScenarioData();
    }
  }, [user, scenarioId]);

  const fetchScenarioData = async () => {
    try {
      console.log('🔍 Fetching scenario:', scenarioId);
      console.log('🔑 Token exists:', !!localStorage.getItem('token'));
      
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
  
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        console.log('✅ Setting scenario data');
        console.log('📚 Lessons found:', data.scenario.lessons?.length || 0);
        setScenario(data.scenario); // This should now include lessons
      } else {
        console.log('❌ API returned error:', data.error);
        setError(data.error || 'Failed to load scenario');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError('Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };
  
  

  const startLesson = (lessonId: string) => {
    router.push(`/scenarios/${scenarioId}/lessons/${lessonId}/learn`);
  };

  const calculateProgress = () => {
    if (!scenario?.lessons) return 0;
    const completedLessons = scenario.lessons.filter(l => l.completed).length;
    return (completedLessons / scenario.lessons.length) * 100;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Card className="glass-effect border-gray-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please log in to access your scenarios.</p>
            <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your scenario...</p>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Card className="glass-effect border-red-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Learn <span className="gradient-text">{scenario.metadata.language}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-4">{scenario.metadata.purpose}</p>
            <Badge variant="secondary" className="bg-purple-800 text-purple-200">
              {scenario.metadata.focus}
            </Badge>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="glass-effect border-gray-700/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Progress</span>
                  <span className="text-gray-400">{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-3" />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="font-semibold text-white">{scenario.lessons.length} Lessons</div>
                  <div className="text-sm text-gray-400">Progressive difficulty</div>
                </div>
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <div className="font-semibold text-white">{scenario.metadata.total_words} Words</div>
                  <div className="text-sm text-gray-400">Essential vocabulary</div>
                </div>
                <div className="text-center">
                  <Volume2 className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <div className="font-semibold text-white">{scenario.metadata.total_sentences} Sentences</div>
                  <div className="text-sm text-gray-400">Practical phrases</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {scenario.lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              className={`glass-effect transition-all duration-300 hover:scale-105 ${
                lesson.completed 
                  ? 'border-green-700/50 bg-green-900/10' 
                  : 'border-gray-700/50 hover:border-purple-500/50'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      lesson.completed ? 'bg-green-600' : 'bg-purple-600'
                    }`}>
                      {lesson.completed ? '✓' : index + 1}
                    </div>
                    {lesson.name}
                  </CardTitle>
                  {lesson.completed && (
                    <Badge variant="secondary" className="bg-green-800 text-green-200">
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Content Items:</span>
                    <span className="text-white">{lesson.contentItems.length}</span>
                  </div>
                  
                  {lesson.score > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Best Score:</span>
                      <span className="text-yellow-400">{lesson.score}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-blue-600 text-blue-300">
                      {lesson.contentItems.filter(item => item.type === 'vocabulary').length} Words
                    </Badge>
                    <Badge variant="outline" className="border-green-600 text-green-300">
                      {lesson.contentItems.filter(item => item.type === 'sentence').length} Sentences
                    </Badge>
                  </div>

                  <Button
                    onClick={() => startLesson(lesson.id)}
                    className={`w-full ${
                      lesson.completed 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {lesson.completed ? 'Practice Again' : 'Start Lesson'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}