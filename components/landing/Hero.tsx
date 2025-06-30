'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Star, 
  Users, 
  Award, 
  Sparkles, 
  Brain, 
  MessageCircle, 
  Gamepad2,
  Target,
  Zap,
  User,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const { user } = useAuth();
  const router = useRouter();

  // Handle auth redirects
  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  // Auth Box Component
  const AuthBox = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mb-8"
    >
      <div className="glass-effect border border-purple-500/30 rounded-2xl p-6 text-center bg-gradient-to-r from-purple-900/20 to-pink-900/20 glow-purple">
        <div className="flex items-center justify-center mb-3">
          <User className="h-6 w-6 text-purple-400 mr-2" />
          <h3 className="text-xl font-bold gradient-text">
            Ready to Start Learning?
          </h3>
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          Create your account to unlock personalized experiences and track your progress
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            variant="glow"
            size="sm"
            onClick={handleLogin}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 min-w-[120px]"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
          
          <span className="text-gray-400 text-xs hidden sm:block">or</span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignup}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 min-w-[120px]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          <p>✨ Free to join • 🚀 Instant access</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pt-24 pb-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-purple-800/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl"
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center glass-effect text-purple-300 px-6 py-3 rounded-full text-sm font-medium mb-8 glow-purple"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Revolutionary AI Language Learning
            </motion.div>

            <motion.a
              href="https://bolt.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center glass-effect text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-8 glow-purple ml-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <img src="/white_circle_360x360.png" alt="Bolt.new" className="h-8 w-8 mr-2 rounded-full" />
              Powered by Bolt.new
            </motion.a>

            <motion.h1
              className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ lineHeight: '1.2' }}
            >
              Master Languages
              <span className="gradient-text block mt-2 pb-4 leading-normal">
                Through Play
              </span>
            </motion.h1>

            <motion.div
              className="text-xl text-gray-300 mb-10 leading-relaxed max-w-xl space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-2xl font-semibold gradient-text">
                Learn What You Need. When You Need It.
              </p>
              
              <div className="space-y-3 text-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💬</span>
                  <span><strong>Dating in Paris?</strong> Learn romantic French phrases</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🧭</span>
                  <span><strong>Backpacking in Tokyo?</strong> Master survival Japanese</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎤</span>
                  <span><strong>Business in Berlin?</strong> Perfect professional German</span>
                </div>
              </div>

              <p className="text-xl font-medium text-purple-300 mt-6">
                AI-powered games that adapt to <em>your</em> real-world goals.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Button
                onClick={handleSignup}
                variant="glow"
                size="lg"
                className="group"
              >
                <PlayCircle className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Your Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="glass-effect border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                See Magic in Action
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-400" />
                <span className="font-medium text-gray-300">100K+ Learners</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-pink-400" />
                <span className="font-medium text-gray-300">98% Success Rate</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-cyan-400" />
                <span className="font-medium text-gray-300">4.9/5 Rating</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Auth Box - Only show when user is not logged in */}
              {!user && <AuthBox />}

              {/* Main Dashboard Preview */}
              <motion.div
                className="glass-effect border border-purple-500/30 rounded-3xl p-8 shadow-2xl glow-purple"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white text-xl">Your Learning Universe</h3>
                    <Badge variant="glow" className="animate-pulse">
                      AI Active
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center">
                        <MessageCircle className="h-8 w-8 mr-3 text-purple-400" />
                        <div>
                          <span className="font-semibold text-white block">Romantic French 💕</span>
                          <span className="text-sm text-purple-300">Date Night Prep</span>
                        </div>
                      </div>
                      <div className="w-20 bg-purple-800/50 rounded-full h-3">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-sm"
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 2, delay: 1 }}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-xl backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center">
                        <Gamepad2 className="h-8 w-8 mr-3 text-cyan-400" />
                        <div>
                          <span className="font-semibold text-white block">Tokyo Navigation 🗾</span>
                          <span className="text-sm text-cyan-300">Survival Japanese</span>
                        </div>
                      </div>
                      <div className="w-20 bg-cyan-800/50 rounded-full h-3">
                        <motion.div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full shadow-sm"
                          initial={{ width: 0 }}
                          animate={{ width: "45%" }}
                          transition={{ duration: 2, delay: 1.5 }}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-400/30 rounded-xl backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center">
                        <Target className="h-8 w-8 mr-3 text-pink-400" />
                        <div>
                          <span className="font-semibold text-white block">Business German 💼</span>
                          <span className="text-sm text-pink-300">Professional Edge</span>
                        </div>
                      </div>
                      <div className="w-20 bg-pink-800/50 rounded-full h-3">
                        <motion.div
                          className="bg-gradient-to-r from-pink-500 to-orange-500 h-3 rounded-full shadow-sm"
                          initial={{ width: 0 }}
                          animate={{ width: "20%" }}
                          transition={{ duration: 2, delay: 2 }}
                        />
                      </div>
                    </motion.div>
                  </div>

                  <motion.button
                    onClick={handleLogin}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 flex items-center justify-center group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Brain className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Continue Learning
                  </motion.button>
                </div>
              </motion.div>

              {/* Floating Game Icons */}
              <motion.div
                className="absolute -top-4 -right-4 glass-effect border border-purple-500/30 rounded-2xl p-4 glow-purple"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Gamepad2 className="h-8 w-8 text-purple-400" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 glass-effect border border-cyan-500/30 rounded-2xl p-4 glow-cyan"
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Zap className="h-8 w-8 text-cyan-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

