'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Brain, CheckCircle } from 'lucide-react';

interface FocusStep {
  userInput: string;
  aiResponse: string;
}

export default function CreateScenarioPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [language, setLanguage] = useState('');
  const [purpose, setPurpose] = useState('');
  const [currentStep, setCurrentStep] = useState<'basic' | 'focus' | 'generating'>('basic');
  
  // Focus refinement state
  const [focusSteps, setFocusSteps] = useState<FocusStep[]>([]);
  const [currentFocusInput, setCurrentFocusInput] = useState('');
  const [isLoadingClarification, setIsLoadingClarification] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  const languages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Russian'
  ];

  // Step 1: Basic Info
  const handleBasicSubmit = () => {
    if (language && purpose) {
      setCurrentStep('focus');
    }
  };

  // Step 2: Focus Area Refinement
  const handleFocusSubmit = async () => {
    if (!currentFocusInput.trim()) return;

    setIsLoadingClarification(true);
    try {
      const response = await fetch('/api/content/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language,
          purpose,
          userInput: currentFocusInput,
          previousInputs: focusSteps.map(step => step.userInput)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFocusSteps(prev => [...prev, {
          userInput: currentFocusInput,
          aiResponse: data.clarification
        }]);
        setCurrentFocusInput('');
      }
    } catch (error) {
      console.error('Focus clarification failed:', error);
    } finally {
      setIsLoadingClarification(false);
    }
  };

  // Step 3: Generate Complete Scenario
  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true);
    setCurrentStep('generating');

    try {
      const allFocusInputs = focusSteps.map(step => step.userInput).join(', ');
      
      const response = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language,
          purpose,
          focus: allFocusInputs
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to the new scenario
        router.push(`/scenarios/${data.scenario.id}`);
      } else {
        throw new Error(data.error || 'Failed to generate scenario');
      }
    } catch (error) {
      console.error('Scenario generation failed:', error);
      setCurrentStep('focus'); // Go back to focus step
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  if (!user) {
    return <div>Please log in to create scenarios.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
<div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Create Learning Scenario</h1>
        <p className="text-gray-400">Tell us your language learning goals and we'll create a personalized experience</p>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 'basic' && (
        <Card className="glass-effect border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-6 w-6 mr-2 text-purple-400" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Which language do you want to learn?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {languages.map(lang => (
                  <Button
                    key={lang}
                    variant={language === lang ? "glow" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(lang)}
                    className={language === lang ? "bg-purple-600" : ""}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Why do you want to learn this language?
              </label>
              <Input
                placeholder="e.g., Travel to Spain, Business meetings, Dating, Academic study..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="bg-gray-800/50 border-gray-600"
              />
            </div>

            <Button 
              onClick={handleBasicSubmit}
              disabled={!language || !purpose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Continue to Focus Areas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Focus Area Refinement */}
      {currentStep === 'focus' && (
        <div className="space-y-6">
          <Card className="glass-effect border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-cyan-400" />
                Refine Your Focus Areas
              </CardTitle>
              <p className="text-gray-400">
                Tell us more about your specific learning goals. Our AI will help refine your focus areas.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., ordering food at restaurants, asking for directions..."
                  value={currentFocusInput}
                  onChange={(e) => setCurrentFocusInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFocusSubmit()}
                  className="bg-gray-800/50 border-gray-600"
                />
                <Button 
                  onClick={handleFocusSubmit}
                  disabled={!currentFocusInput.trim() || isLoadingClarification}
                >
                  {isLoadingClarification ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add Focus'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Focus Conversation History */}
          {focusSteps.map((step, index) => (
            <div key={index} className="space-y-3">
              <Card className="bg-blue-900/20 border-blue-700/50">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-sm font-bold">You</span>
                    </div>
                    <p className="text-gray-200">{step.userInput}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-700/50">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div className="text-gray-200 whitespace-pre-line">{step.aiResponse}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Generate Scenario Button */}
          {focusSteps.length > 0 && (
            <Card className="glass-effect border-green-700/50 bg-green-900/10">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Ready to Generate!</h3>
                <p className="text-gray-300 mb-4">
                  We have enough information to create your personalized learning scenario.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentFocusInput('')}
                    className="border-gray-600"
                  >
                    Add More Focus Areas
                  </Button>
                  <Button
                    onClick={handleGenerateScenario}
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    Generate My Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Generating */}
      {currentStep === 'generating' && (
        <Card className="glass-effect border-purple-700/50">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-purple-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Creating Your Scenario</h3>
            <div className="space-y-2 text-gray-300">
              <p>🧠 Generating personalized content with AI...</p>
              <p>📚 Creating vocabulary and sentences...</p>
              <p>🎵 Generating audio pronunciations...</p>
              <p>🎮 Setting up your learning games...</p>
            </div>
            <p className="text-sm text-gray-400 mt-6">This may take 1-2 minutes...</p>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}