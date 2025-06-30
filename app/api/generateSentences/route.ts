import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { input, language } = await request.json();

    if (!input || !language) {
      return NextResponse.json(
        { error: 'Input and language are required' },
        { status: 400 }
      );
    }

    const languageNames: { [key: string]: string } = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'en': 'English',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };

    const targetLanguage = languageNames[language] || language;

    const prompt = `Based on this context: "${input}", generate 5 practical sentences in ${targetLanguage} that would be useful for this situation. 

For each sentence, provide:
1. The sentence in ${targetLanguage}
2. English translation
3. Pronunciation guide (if not English)
4. Cultural context or usage note

Format as a JSON array where each item has: sentence, translation, pronunciation, context

Make the sentences practical and immediately useful for the given scenario.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a language learning assistant. Generate practical, contextually relevant sentences for language learners. Always respond with valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated');
    }

    // Try to parse JSON, fallback to simple sentences if parsing fails
    let sentences;
    try {
      sentences = JSON.parse(content);
    } catch (parseError) {
      // Fallback: extract sentences from text
      const lines = content.split('\n').filter(line => line.trim());
      sentences = lines.slice(0, 5).map((line, index) => ({
        sentence: line.trim(),
        translation: `Translation ${index + 1}`,
        pronunciation: 'Pronunciation guide',
        context: 'Usage context'
      }));
    }

    return NextResponse.json({ sentences });

  } catch (error: any) {
    console.error('Sentence generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sentences' },
      { status: 500 }
    );
  }
}