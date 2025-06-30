"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Scenario } from '@/lib/schemas';
import { Volume2, Loader2, Mic, Square, Speech, CheckCircle } from 'lucide-react';
import type { LearningTakeaways } from '@/app/api/conversation/takeaways/route';
import { useAuth } from '@/contexts/AuthContext';
import { mapLanguageCodeToName, mapLanguageNameToCode } from '@/lib/utils/languageMapping';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble = ({ message, language }: { message: Message; language: string | null }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const [isLoadingPhonetic, setIsLoadingPhonetic] = useState(false);

  const handlePlayAudio = async () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
      return;
    }

    setIsLoadingAudio(true);
    try {
      const { generateHash } = await import('@/lib/utils/helpers');
      const languageName = language ? mapLanguageCodeToName(language) : 'english';
      const hash = generateHash(message.content, languageName); 

      const response = await fetch('/api/generateOrFetchAudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content, language: languageName, type: 'sentence', hash: hash }),
      });
      const data = await response.json();
      setAudioUrl(data.url);
      new Audio(data.url).play();
    } catch (error) {
      console.error('Failed to fetch audio:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleGetPhonetics = async () => {
    if (phonetic) {
      setPhonetic(null); // Toggle off
      return;
    }
    setIsLoadingPhonetic(true);
    try {
      const languageName = language ? mapLanguageCodeToName(language) : 'english';
      const response = await fetch('/api/getPhonetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: message.content, lang: languageName }),
      });
      const data = await response.json();
      setPhonetic(data.phonetic);
    } catch (error) {
      console.error('Failed to fetch phonetics:', error);
    } finally {
      setIsLoadingPhonetic(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
        <div className={`flex items-center gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlayAudio}
                        disabled={isLoadingAudio}
                        className="text-muted-foreground"
                    >
                        {isLoadingAudio ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGetPhonetics}
                        disabled={isLoadingPhonetic}
                        className="text-muted-foreground"
                    >
                        {isLoadingPhonetic ? <Loader2 className="animate-spin" size={16} /> : <Speech size={16} />}
                    </Button>
                </div>
            )}
            <div className={`px-4 py-2 rounded-lg max-w-[80%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                {message.content}
            </div>
        </div>
        {phonetic && (
            <div className="text-sm text-gray-400 italic pl-12">
                {phonetic}
            </div>
        )}
    </div>
  );
};

const ChatInterface = ({ scenario, language }: { scenario: Scenario; language: string | null }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTakeawaysDialog, setShowTakeawaysDialog] = useState(false);
  const [takeawaysData, setTakeawaysData] = useState<LearningTakeaways | null>(null);
  const [isGeneratingTakeaways, setIsGeneratingTakeaways] = useState(false);
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    console.log('Chat history updated:', history);
  }, [history]);

  useEffect(() => {
    const startConversation = async () => {
      console.log('Attempting to start conversation...');
      console.log('Current user:', user);
      console.log('User token:', user?.token);

      if (!language || !user?.token) {
        console.log('Skipping conversation start: language or user token missing.', { language, userToken: user?.token });
        setLoading(false);
        return; 
      }
      setLoading(true);
      try {
        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}` // Add Authorization header
          },
          body: JSON.stringify({ scenarioId: scenario.id, history: [], language }),
        });
        
        console.log('Raw API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setHistory([data]);
        console.log('Initial assistant message received:', data);
        console.log('History after initial message:', [data]);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (scenario.id && language && user) {
        startConversation();
    }
  }, [scenario.id, language, user]);

  const handleUserMessage = async (messageContent: string) => {
    if (!user?.token) return; // Ensure token is available
    const newUserMessage: Message = { role: 'user', content: messageContent };
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setLoading(true);
    setTextInput(''); // Clear text input after sending

    console.log('Sending user message:', newUserMessage);
    console.log('Current history before API call:', newHistory);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` // Add Authorization header
        },
        body: JSON.stringify({ scenarioId: scenario.id, history: newHistory, language }),
      });
      const data = await response.json();
      console.log('Received assistant response:', data);
      setHistory(prev => [...prev, data]);
      console.log('History after assistant response:', [...history, data]);
    } catch (error) {
      console.error('Failed to get assistant response:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!language) {
      alert('Please select a language first.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        // The `expectedText` is not relevant for open conversation, but the API requires it.
        // We can adapt the API later to handle this better.
        formData.append('expectedText', 'placeholder'); 
        formData.append('language', language);

        try {
          const response = await fetch('/api/validateSpeech', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          console.log('Transcription API response:', data);
          if (data.spokenText) {
            handleUserMessage(data.spokenText);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleEndConversation = async () => {
    if (!user?.token) return; // Ensure token is available
    setIsGeneratingTakeaways(true);
    try {
      const response = await fetch('/api/conversation/takeaways', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` // Add Authorization header
        },
        body: JSON.stringify({ history, language }),
      });
      const data = await response.json();
      setTakeawaysData(data);
      setShowTakeawaysDialog(true);
    } catch (error) {
      console.error('Failed to generate takeaways:', error);
    } finally {
      setIsGeneratingTakeaways(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[400px] max-h-[600px]">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-800 rounded-lg shadow-inner">
        {history.map((message, index) => (
          <MessageBubble key={index} message={message} language={language} />
        ))}
        {loading && <div className="text-center text-gray-400">Assistant is thinking...</div>}
        {isTranscribing && <div className="text-center text-gray-400">Transcribing your voice...</div>}
        {isGeneratingTakeaways && <div className="text-center text-gray-400">Generating learning takeaways...</div>}
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-900 flex items-center justify-between">
        <Input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow mr-2 bg-gray-700 text-white border-gray-600 placeholder-gray-400"
          disabled={loading || isTranscribing || isRecording}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && textInput.trim() !== '') {
              handleUserMessage(textInput);
            }
          }}
        />
        <Button
          onClick={() => handleUserMessage(textInput)}
          disabled={loading || isTranscribing || isRecording || textInput.trim() === ''}
          className="mr-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Send
        </Button>
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || loading || isGeneratingTakeaways}
          className={`rounded-full w-16 h-16 transition-colors duration-200 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isRecording ? <Square size={24} /> : <Mic size={24} />}
        </Button>
        <Button
          onClick={handleEndConversation}
          disabled={loading || isTranscribing || isGeneratingTakeaways || history.length <= 1} // Disable if no conversation yet
          variant="outline"
          className="ml-4 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          End Conversation
        </Button>
      </div>

      <Dialog open={showTakeawaysDialog} onOpenChange={setShowTakeawaysDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-400">Conversation Summary & Takeaways</DialogTitle>
            <DialogDescription className="text-gray-300">Here's what you learned from this conversation.</DialogDescription>
          </DialogHeader>
          {takeawaysData ? (
            <div className="space-y-6 mt-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center"><CheckCircle className="mr-2" /> Overall Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200">{takeawaysData.overall_feedback}</p>
                </CardContent>
              </Card>

              {takeawaysData.corrections.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Corrections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {takeawaysData.corrections.map((correction, index) => (
                        <AccordionItem value={`correction-${index}`} key={index} className="border-gray-700">
                          <AccordionTrigger className="font-semibold text-gray-200 hover:no-underline">Your phrase: "{correction.original}"</AccordionTrigger>
                          <AccordionContent className="text-gray-300">
                            <p className="mb-2"><strong>Correction:</strong> {correction.correction}</p>
                            <p><strong>Explanation:</strong> {correction.explanation}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {takeawaysData.new_vocabulary.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">New Vocabulary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {takeawaysData.new_vocabulary.map((vocab, index) => (
                        <AccordionItem value={`vocab-${index}`} key={index} className="border-gray-700">
                          <AccordionTrigger className="font-semibold text-gray-200 hover:no-underline">{vocab.word}</AccordionTrigger>
                          <AccordionContent className="text-gray-300">
                            <p className="mb-2"><strong>Definition:</strong> {vocab.definition}</p>
                            <p><strong>Example:</strong> {vocab.example_sentence}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {takeawaysData.grammar_tips.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Grammar Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-gray-300">
                      {takeawaysData.grammar_tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="animate-spin mx-auto mb-4" size={32} />
              <p>Generating personalized takeaways...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ConversationBox = ({ scenarios }: { scenarios: Scenario[] }) => {
  const [loading, setLoading] = useState(false);

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
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mt-2 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} className="hover:shadow-md transition-shadow duration-200 bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{scenario.metadata.purpose}</CardTitle>
              <span className="text-2xl">{getLanguageFlag(scenario.metadata.language)}</span>
            </div>
            <CardDescription className="text-gray-400">{scenario.metadata.focus}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Start Conversation</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-gray-900 text-white border-gray-700">
                <DialogHeader className="p-6 pb-2 border-b border-gray-700">
                  <DialogTitle className="text-white">{scenario.metadata.purpose}</DialogTitle>
                </DialogHeader>
                <ChatInterface scenario={scenario} language={mapLanguageNameToCode(scenario.metadata.language)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConversationBox;