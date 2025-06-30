
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import Instructor from '@instructor-ai/instructor';
import { z } from 'zod';
import { ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam } from 'groq-sdk/resources/chat/completions';

const groq = new Groq();

// Define the Zod schema for the learning takeaways
const LearningTakeawaysSchema = z.object({
  corrections: z.array(z.object({
    original: z.string().describe("The user's original phrase or sentence."),
    correction: z.string().describe("The corrected version of the phrase or sentence."),
    explanation: z.string().describe("A brief explanation of why the correction was made."),
  })).describe("Grammar or phrasing corrections for the user's input."),
  new_vocabulary: z.array(z.object({
    word: z.string().describe("A new word or idiom introduced by the AI."),
    definition: z.string().describe("The definition of the new word/idiom."),
    example_sentence: z.string().describe("An example sentence using the new word/idiom."),
  })).describe("New vocabulary learned during the conversation."),
  grammar_tips: z.array(z.string()).describe("General grammar tips relevant to the user's performance."),
  overall_feedback: z.string().describe("A concise, encouraging summary of the user's performance."),
});

export type LearningTakeaways = z.infer<typeof LearningTakeawaysSchema>;

export async function POST(req: NextRequest) {
  const { history, language }: {
    history: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[];
    language: string;
  } = await req.json();

  if (!history || history.length === 0 || !language) {
    return NextResponse.json({ error: 'Missing conversation history or language' }, { status: 400 });
  }

  const instructor = Instructor({ client: groq, mode: 'TOOLS' });

  const messages: (ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam | ChatCompletionSystemMessageParam)[] = [
    {
      role: 'system',
      content: `You are an expert language tutor. Analyze the following conversation between a language learner (user) and an AI assistant. Provide structured learning takeaways for the user in ${language}. Focus on:
      1. Specific corrections for grammar, vocabulary, or phrasing in the user's responses.
      2. New vocabulary or idioms introduced by the AI assistant that the user might benefit from.
      3. General grammar tips relevant to the user's mistakes or areas for improvement.
      4. An overall encouraging feedback summary.
      
      Ensure the output strictly adheres to the provided JSON schema. Be concise and helpful.`,
    },
    ...history,
  ];

  try {
    const takeaways = await instructor.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      response_model: { schema: LearningTakeawaysSchema, name: 'LearningTakeaways' },
      temperature: 0.5,
    });

    return NextResponse.json(takeaways);
  } catch (error) {
    console.error('Error generating learning takeaways:', error);
    return NextResponse.json({ error: 'Failed to generate learning takeaways.' }, { status: 500 });
  }
}
