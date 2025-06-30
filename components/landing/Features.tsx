'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  MessageCircle, 
  Gamepad2, 
  Target, 
  Puzzle, 
  Headphones,
  Zap,
  Users,
  Trophy,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Scenarios',
    description: 'Tell us your goal, and our AI creates personalized learning paths just for you.',
    color: 'from-purple-500 to-pink-500',
    glowColor: 'glow-purple',
    badge: 'Smart AI'
  },
  {
    icon: MessageCircle,
    title: 'Real Conversations',
    description: 'Practice with our AI conversation partner in realistic scenarios.',
    color: 'from-cyan-500 to-blue-500',
    glowColor: 'glow-cyan',
    badge: 'Interactive'
  },
  {
    icon: Gamepad2,
    title: 'Addictive Games',
    description: 'Learn through 5 different game types that make vocabulary stick.',
    color: 'from-pink-500 to-orange-500',
    glowColor: 'glow-pink',
    badge: 'Fun Learning'
  },
  {
    icon: Target,
    title: 'Context-Aware',
    description: 'Every word and phrase is relevant to your specific use case.',
    color: 'from-green-500 to-teal-500',
    glowColor: 'shadow-green-500/25',
    badge: 'Relevant'
  },
  {
    icon: Puzzle,
    title: 'Adaptive Difficulty',
    description: 'Games automatically adjust to your skill level for optimal learning.',
    color: 'from-indigo-500 to-purple-500',
    glowColor: 'shadow-indigo-500/25',
    badge: 'Adaptive'
  },
  {
    icon: Trophy,
    title: 'Progress Tracking',
    description: 'See your improvement across all scenarios and games.',
    color: 'from-yellow-500 to-orange-500',
    glowColor: 'shadow-yellow-500/25',
    badge: 'Analytics'
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-cyan-600/5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Badge variant="glow" className="mb-4 text-lg px-6 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Revolutionary Features
          </Badge>
          <h2 className="text-5xl font-bold text-white mb-6">
            Why DAPI Changes
            <span className="gradient-text block">Everything</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Traditional language learning is broken. We've rebuilt it from the ground up 
            with AI, games, and real-world focus.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`glass-effect border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group hover:${feature.glowColor} h-full`}>
                <CardHeader className="text-center pb-4">
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} p-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <Badge variant="secondary" className="mb-3">
                    {feature.badge}
                  </Badge>
                  <CardTitle className="text-white text-xl group-hover:gradient-text transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Game Types Showcase */}
        <motion.div
          className="mt-24"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              5 Game Types That Make Learning
              <span className="gradient-text"> Addictive</span>
            </h3>
            <p className="text-gray-300 text-lg">
              Each game targets different aspects of language learning
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { icon: '🀄', name: 'Mahjong Match', desc: 'Vocabulary pairing' },
              { icon: '🎧', name: 'Audio Catch', desc: 'Listening skills' },
              { icon: '📝', name: 'Word Sprint', desc: 'Speed translation' },
              { icon: '🎯', name: 'Target Shoot', desc: 'Quick recognition' },
              { icon: '🧩', name: 'Puzzle Builder', desc: 'Sentence construction' }
            ].map((game, index) => (
              <motion.div
                key={game.name}
                className="glass-effect border border-gray-700/50 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-3">{game.icon}</div>
                <h4 className="font-semibold text-white mb-2 group-hover:gradient-text transition-all duration-300">
                  {game.name}
                </h4>
                <p className="text-sm text-gray-400">{game.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;