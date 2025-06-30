import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {z} from 'zod';
import Instructor, {InstructorClient} from '@instructor-ai/instructor'

const PhoneticsSchema = z.object({phonetic: z.string().min(1)})
type PhoneticsType = z.infer<typeof PhoneticsSchema>

export async function POST(req: NextRequest) {
    const { sentence, lang } = await req.json();
    if (!sentence || !lang) {
        return NextResponse.json({ error: 'Missing sentence or lang' }, { status: 400 });
    }
    const client = new Groq();
    const prompt = `Provide a clear, **romanized phonetic transcription using the English alphabet** of the following sentence in ${lang}. The transcription should be easy to understand for a native English speaker, similar to how 'こんにちは' would be transcribed as 'konee-cheewa'. It should accurately capture the pronunciation of the word in the intended language.

Sentence: "${sentence}"

Return only the phonetic transcription in a single line.`;
    const instructor = Instructor({client, mode:'TOOLS'})
    const chatCompletion : PhoneticsType = await instructor.chat.completions.create({
        messages: [
            { role: 'user', content: prompt },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        response_model: {
            name: 'Phonetic',
            schema: PhoneticsSchema,
        },
        max_retries: 3,
    });
    const cleanedPhonetic = chatCompletion.phonetic.replace(/^[\s-]+/, ''); // Remove leading hyphens and spaces
    return NextResponse.json({ phonetic: cleanedPhonetic });
}
