import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {z} from 'zod';
import Instructor, {InstructorClient} from '@instructor-ai/instructor'

const SentenceSchema = z.object({translatedSentence: z.string().min(1)})
type SentenceType = z.infer<typeof SentenceSchema>

export async function POST(req: NextRequest) {
  const { sentence, lang } = await req.json();
  if (!sentence || !lang) {
    return NextResponse.json({ error: 'Missing sentence or lang' }, { status: 400 });
  }
  const client = new Groq();
  const prompt = `Translate the following sentence to ${lang} and return only the translated sentence, nothing else.\nSentence: ${sentence}. Respond in JSON`;
  const instructor = Instructor({client, mode:'TOOLS'})
  const chatCompletion : SentenceType = await instructor.chat.completions.create({
    messages: [
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.2,
    max_completion_tokens: 128,
    top_p: 1,
    stream: false,
    stop: null,
    response_model: {
      name: 'Sentence',
      schema: SentenceSchema,
    },
    max_retries: 2,
  });
  return NextResponse.json({ sentence: chatCompletion.translatedSentence });
}
