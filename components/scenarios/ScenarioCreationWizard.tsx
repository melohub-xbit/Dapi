'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Sparkles, 
  Globe, 
  Target, 
  Brain,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  BookOpen,
  Gamepad2
} from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Choose Language', description: 'What language do you want to learn?' },
  { id: 2, title: 'Define Purpose', description: 'Why do you want to learn this language?' },
  { id: 3, title: 'Clarify Focus', description: 'Let\'s get specific about your goals' },
  { id: 4, title: 'Generate Content', description: 'Creating your personalized learning experience' }
];

const POPULAR_LANGUAGES = [
  { code: 'spanish', name: 'Spanish', flag: '🇪🇸', learners: '500M+' },
  { code: 'french', name: 'French', flag: '🇫🇷', learners: '280M+' },
  { code: 'german', name: 'German', flag: '🇩🇪', learners: '100M+' },
  { code: 'italian', name: 'Italian', flag: '🇮🇹', learners: '65M+' },
  { code: 'portuguese', name: 'Portuguese', flag: '🇵🇹', learners: '260M+' },
  { code: 'japanese', name: 'Japanese', flag: '🇯🇵', learners: '125M+' }
];

export default function ScenarioCreationWizard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [language, setLanguage] = useState('');
  const [purpose, setPurpose] = useState('');
  const [focusInputs, setFocusInputs] = useState<string[]>([]);
  const [currentFocusInput, setCurrentFocusInput] = useState('');
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [isGeneratingClarification, setIsGeneratingClarification] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [scenarioCreated, setScenarioCreated] = useState(false);
  const [createdScenarioId, setCreatedScenarioId] = useState('');

  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setCurrentStep(2);
  };

  const handlePurposeNext = () => {
    if (purpose.trim()) {
      setCurrentStep(3);
    }
  };

  const handleAddFocus = async () => {
    if (!currentFocusInput.trim()) return;

    setIsGeneratingClarification(true);
    const newFocusInputs = [...focusInputs, currentFocusInput.trim()];
    setFocusInputs(newFocusInputs);

    try {
      const response = await fetch('/api/scenarios/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language,
          purpose,
          userInput: currentFocusInput.trim(),
          previousInputs: focusInputs
        })
      });

      const data = await response.json();
      if (data.success) {
        setClarificationResponse(data.clarification);
      }
    } catch (error) {
      console.error('Clarification failed:', error);
      setClarificationResponse('I understand! Let me know if you want to add more focus areas or if you\'re ready to create your learning scenario.');
    } finally {
      setIsGeneratingClarification(false);
      setCurrentFocusInput('');
    }
  };

  const handleCreateScenario = async () => {
    setIsGeneratingScenario(true);
    setCurrentStep(4);
    setGenerationProgress(0);
    setGenerationStatus('Initializing AI content generation...');

    // Simulate progress updates
    const progressSteps = [
      { progress: 10, status: 'Analyzing your learning goals...' },
      { progress: 25, status: 'Generating vocabulary with AI...' },
      { progress: 40, status: 'Creating practical sentences...' },
      { progress: 55, status: 'Designing 4 progressive lessons...' },
      { progress: 70, status: 'Generating audio pronunciations...' },
      { progress: 85, status: 'Uploading audio files to cloud...' },
      { progress: 95, status: 'Finalizing your learning experience...' },
      { progress: 100, status: 'Complete! Your scenario is ready!' }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setGenerationProgress(progressSteps[stepIndex].progress);
        setGenerationStatus(progressSteps[stepIndex].status);
        stepIndex++;
      }
    }, 2000);

    try {
      const response = await fetch('/api/scenarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language,
          purpose,
          focus: focusInputs.join(', ')
        })
      });

      const data = await response.json();
      
      clearInterval(progressInterval);
      
      if (data.success) {
        setGenerationProgress(100);
        setGenerationStatus('Complete! Your scenario is ready!');
        setScenarioCreated(true);
        setCreatedScenarioId(data.data.scenario.id);
        
        setTimeout(() => {
          router.push(`/scenarios/${data.data.scenario.id}`);
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create scenario');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Scenario creation failed:', error);
      setGenerationStatus('❌ Failed to create scenario. Please try again.');
      setIsGeneratingScenario(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Globe className="h-16 w-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-3xl font-bold text-white mb-2">Choose Your Language</h2>
              <p className="text-gray-400">Select the language you want to master</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_LANGUAGES.map((lang) => (
                <Card
                  key={lang.code}
                  className={`glass-effect border-gray-700/50 hover:border-purple-500/50 cursor-pointer transition-all duration-300 group ${
                    language === lang.code ? 'border-purple-500 bg-purple-900/20' : ''
                  }`}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{lang.flag}</div>
                    <h3 className="font-semibold text-white mb-1 group-hover:gradient-text transition-all">
                      {lang.name}
                    </h3>
                    <p className="text-sm text-gray-400">{lang.learners} speakers</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm">Don't see your language? We support many more!</p>
              <Input
                placeholder="Type any language..."
                className="mt-3 max-w-md mx-auto glass-effect border-gray-700"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleLanguageSelect(e.currentTarget.value.trim());
                  }
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white mb-2">What's Your Goal?</h2>
              <p className="text-gray-400">Tell us why you want to learn {language}</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Textarea
                placeholder="e.g., I want to travel to Spain and be able to order food, ask for directions, and have basic conversations with locals..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="glass-effect border-gray-700 min-h-32 text-lg"
                rows={4}
              />

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="border-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePurposeNext}
                  disabled={!purpose.trim()}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Brain className="h-16 w-16 mx-auto mb-4 text-pink-400" />
              <h2 className="text-3xl font-bold text-white mb-2">Let's Get Specific</h2>
              <p className="text-gray-400">Help us understand your exact focus areas</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Current Focus Areas */}
              {focusInputs.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3">Your Focus Areas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {focusInputs.map((focus, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-800 text-purple-200">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Clarification Response */}
              {clarificationResponse && (
                <Card className="glass-effect border-purple-500/30 bg-purple-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <MessageCircle className="h-5 w-5 text-purple-400 mr-3 mt-1 flex-shrink-0" />
                      <div className="text-gray-300 whitespace-pre-wrap">{clarificationResponse}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Focus Input */}
              <div className="space-y-3">
                <Input
                  placeholder="Add a specific focus area (e.g., 'ordering food at restaurants')"
                  value={currentFocusInput}
                  onChange={(e) => setCurrentFocusInput(e.target.value)}
                  className="glass-effect border-gray-700"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFocus();
                    }
                  }}
                />
                <Button
                  onClick={handleAddFocus}
                  disabled={!currentFocusInput.trim() || isGeneratingClarification}
                  variant="outline"
                  className="w-full border-gray-600"
                >
                  {isGeneratingClarification ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI is thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Add Focus Area
                    </>
                  )}
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="border-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateScenario}
                  disabled={focusInputs.length === 0}
                  className="bg-gradient-to-r from-pink-600 to-purple-600"
                >
                  Create My Scenario
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {scenarioCreated ? (
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
              ) : (
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-purple-400 animate-spin" />
              )}
              <h2 className="text-3xl font-bold text-white mb-2">
                {scenarioCreated ? 'Scenario Created!' : 'Creating Your Learning Experience'}
              </h2>
              <p className="text-gray-400">
                {scenarioCreated 
                  ? 'Your personalized language learning scenario is ready!'
                  : 'Our AI is crafting your personalized content...'
                }
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-gray-400">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-3" />
                <p className="text-center text-gray-300">{generationStatus}</p>
              </div>

              {scenarioCreated && (
                <div className="mt-8 space-y-4">
                  <Card className="glass-effect border-green-700/50 bg-green-900/10">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-400" />
                          <div className="font-semibold text-white">4 Lessons</div>
                          <div className="text-sm text-gray-400">Progressive difficulty</div>
                        </div>
                        <div>
                          <Volume2 className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                          <div className="font-semibold text-white">Audio Ready</div>
                          <div className="text-sm text-gray-400">Native pronunciation</div>
                        </div>
                        <div>
                          <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                          <div className="font-semibold text-white">5 Game Types</div>
                          <div className="text-sm text-gray-400">Interactive learning</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Redirecting to your new scenario...</p>
                    <div className="animate-pulse">
                      <div className="h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        default:
            return null;
        }
      };
    
      if (!user) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
            <Card className="glass-effect border-gray-700/50 max-w-md">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                <p className="text-gray-400 mb-6">Please log in to create your learning scenario.</p>
                <Button onClick={() => router.push('/auth/login')} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }
    
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                Create Your Learning
                <span className="gradient-text block">Scenario</span>
              </h1>
              <p className="text-xl text-gray-300">
                AI-powered, personalized language learning just for you
              </p>
            </div>
    
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {WIZARD_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        currentStep >= step.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                          currentStep > step.id
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  {WIZARD_STEPS[currentStep - 1]?.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {WIZARD_STEPS[currentStep - 1]?.description}
                </p>
              </div>
            </div>
    
            {/* Main Content */}
            <Card className="glass-effect border-gray-700/50">
              <CardContent className="p-8">
                {renderStep()}
              </CardContent>
            </Card>
    
            {/* Summary Card (visible after step 1) */}
            {currentStep > 1 && (
              <Card className="glass-effect border-gray-700/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Your Learning Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {language && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Language:</span>
                      <Badge variant="secondary" className="bg-purple-800">
                        {language.charAt(0).toUpperCase() + language.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {purpose && (
                    <div>
                      <span className="text-gray-400 block mb-1">Purpose:</span>
                      <p className="text-white text-sm">{purpose}</p>
                    </div>
                  )}
                  {focusInputs.length > 0 && (
                    <div>
                      <span className="text-gray-400 block mb-2">Focus Areas:</span>
                      <div className="flex flex-wrap gap-2">
                        {focusInputs.map((focus, index) => (
                          <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }
    