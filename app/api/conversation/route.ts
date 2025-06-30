import { NextResponse, NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam } from 'groq-sdk/resources/chat/completions';
import { ScenarioService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

const groq = new Groq();

export interface ConversationRequest {
  scenarioId: string;
  history: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[];
  language: string; // e.g., 'French', 'Spanish'
}

export interface ConversationResponse {
  role: 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No token provided' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const decoded = AuthService.verifyToken(token);
  if (!decoded || !decoded.email) {
    return NextResponse.json(
      { error: 'Invalid token or missing user email' },
      { status: 401 }
    );
  }

  const userEmail = decoded.email;

  const { scenarioId, history, language }: ConversationRequest = await request.json();

  const scenario = await ScenarioService.getScenarioById(scenarioId);

  if (!scenario || scenario.userEmail !== userEmail) {
    return NextResponse.json({ error: 'Scenario not found or access denied' }, { status: 404 });
  }

  const systemPrompt = `You are an AI language tutor helping a student practice ${scenario.metadata.language}. The scenario is: ${scenario.metadata.purpose}. Focus on ${scenario.metadata.focus}. Your goal is to have a natural conversation, correct the user gently, and encourage them. You must speak only in ${scenario.metadata.language}.`;

  // If the history is empty, it's the start of the conversation.
  if (history.length === 0) {
    // Generate the initial message using Groq based on the scenario and language
    const initialPrompt: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
      {
        role: 'system',
        content: `${systemPrompt} Start the conversation.`
      },
    ];

    try {
      const initialCompletion = await groq.chat.completions.create({
        messages: initialPrompt,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_completion_tokens: 150,
        top_p: 1,
        stream: false,
      });
      const initialContent = initialCompletion.choices[0]?.message?.content || "Hello!";
      return NextResponse.json({ role: 'assistant', content: initialContent });
    } catch (error) {
      console.error('Error generating initial conversation message:', error);
      return NextResponse.json({ error: 'Failed to start conversation with AI.' }, { status: 500 });
    }
  }

  let currentSystemPrompt = systemPrompt;
  const MAX_HISTORY_LENGTH = 10; // Trigger summary if history exceeds this
  const MAX_RECENT_MESSAGES = 4; // Keep this many recent messages verbatim

  let messagesToSendToGroq = history;

  // Implement rolling summary
  if (history.length > MAX_HISTORY_LENGTH) {
    const messagesToSummarize = history.slice(0, history.length - MAX_RECENT_MESSAGES);
    const recentMessages = history.slice(-MAX_RECENT_MESSAGES);

    // Call Groq to summarize older messages
    const summaryPrompt: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam | ChatCompletionSystemMessageParam)[] = [
      {
        role: 'system',
        content: `Summarize the following conversation history concisely to maintain context for a language learning AI. Focus on key topics, decisions, and the current state of the interaction. The summary should be no more than 50 words. The conversation is in ${language}.
        Conversation context: ${scenario.metadata.purpose} - ${scenario.metadata.focus}`
      },
      ...messagesToSummarize
    ];

    try {
      const summaryCompletion = await groq.chat.completions.create({
        messages: summaryPrompt,
        model: 'llama-3.1-8b-instant', // Use a smaller model for summarization if sufficient
        temperature: 0.1,
        max_completion_tokens: 50,
      });
      const summary = summaryCompletion.choices[0]?.message?.content || "";
      currentSystemPrompt += `\n\nPrevious conversation summary: ${summary}`;
      messagesToSendToGroq = recentMessages; // Only send recent messages after summarization
    } catch (summaryError) {
      console.error('Error generating summary:', summaryError);
      // Fallback to sending just recent messages if summarization fails
      messagesToSendToGroq = history.slice(-MAX_RECENT_MESSAGES);
    }
  } else {
    // If history is not too long, just send the last few messages
    messagesToSendToGroq = history.slice(-MAX_RECENT_MESSAGES);
  }


  const messagesForApi: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam | ChatCompletionSystemMessageParam)[] = [
    {
      role: 'system',
      content: currentSystemPrompt
    },
    ...messagesToSendToGroq
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: messagesForApi,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7, // A bit more creative for natural conversation
        max_completion_tokens: 150,
        top_p: 1,
        stream: false,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "I'm not sure what to say.";

    return NextResponse.json({ role: 'assistant', content: responseContent });

  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to get a response from the AI.' }, { status: 500 });
  }
}