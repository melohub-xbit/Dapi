'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SentenceBox from '@/components/sentences/SentenceBox';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SentencesPage() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [input, setInput] = useState('hey im indian student going to france for research');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to landing if not authenticated
  React.useEffect(() => {
    if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  async function generateSentences() {
    setLoading(true);
    setSentences([]);
    const res = await fetch('/api/generateSentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, language }),
    });
    const data = await res.json();
    setSentences(data.sentences);
    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading sentences...</p>
        </motion.div>
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
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Sentence Learning
          </h1>
          <p className="text-gray-300 text-lg">
            Master vocabulary through contextual sentences
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <select
              value={language || ''}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 glass-effect border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">Choose a language...</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="en">English</option>
            </select>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a topic or phrase..."
              disabled={loading}
              className="flex-1 px-4 py-2 glass-effect border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
            <Button
              onClick={generateSentences}
              disabled={loading || !input}
              variant="outline"
            >
              {loading ? 'Generating...' : 'Learn'}
            </Button>
          </div>
          <div className="space-y-6">
            {sentences.map((sentence, idx) => (
              <SentenceBox key={idx} sentence={sentence} language={language} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}