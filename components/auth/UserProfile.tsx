'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, Trophy, Target, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/'); // Redirect to home page after logout
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={handleToggle}
        className="glass-effect border border-purple-500/30 text-white hover:bg-purple-500/10 hover:border-purple-400/50 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block font-medium">{user.username}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && buttonRect && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-transparent z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <motion.div
                className="fixed w-80 glass-effect border border-purple-500/30 rounded-2xl shadow-2xl glow-purple z-[9999]"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  top: buttonRect.bottom + 8,
                  right: window.innerWidth - buttonRect.right,
                }}
              >
                <div className="p-6 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-purple-500/30">
                  {/* User Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{user.username}</h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <Badge variant="glow" className="mt-1 text-xs">
                        Language Explorer
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-effect border border-gray-700/50 rounded-xl p-3 text-center">
                      <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                      <div className="text-white font-semibold">0</div>
                      <div className="text-gray-400 text-xs">Games Won</div>
                    </div>
                    <div className="glass-effect border border-gray-700/50 rounded-xl p-3 text-center">
                      <Target className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                      <div className="text-white font-semibold">0</div>
                      <div className="text-gray-400 text-xs">Scenarios</div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  {/* <div className="space-y-2 mb-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Button>
                  </div> */}

                  {/* Logout */}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default UserProfile;
