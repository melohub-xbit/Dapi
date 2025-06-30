'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ConversationBox from '@/components/conversation/ConversationBox';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Scenario } from '@/lib/schemas';

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchScenarios = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`/api/scenarios?userEmail=${user.email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scenarios');
        }
        const data = await response.json();
        setScenarios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchScenarios();
    }
  }, [user]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading conversation...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400 text-lg">Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Chatting as: <span className="text-purple-400">{user.username}</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            AI Conversation Practice
          </h1>
          <p className="text-gray-300 text-lg">
            Practice real conversations with your AI language partner
          </p>
        </div>

        <ConversationBox scenarios={scenarios} />
      </div>
    </motion.div>
  );
}