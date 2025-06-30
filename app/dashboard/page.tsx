'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Dashboard from '@/components/dashboard/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [currentScenario, setCurrentScenario] = useState<any>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to landing if not authenticated
  React.useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleCreateScenario = () => {
    router.push('/scenarios/create');
  };

  const handlePlayScenario = (scenarioId: string) => {
    router.push(`/scenarios/${scenarioId}`);
  };

  const handleStartConversation = () => {
    router.push('/conversation');
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading your dashboard...</p>
          </motion.div>
        </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
      <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
      >
        <Dashboard
            onStartConversation={handleStartConversation}
            onCreateScenario={handleCreateScenario}
            onPlayScenario={handlePlayScenario}
        />
      </motion.div>
  );
}