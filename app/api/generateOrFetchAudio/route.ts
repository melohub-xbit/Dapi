import { NextRequest, NextResponse } from 'next/server';
import { getAudioUrlForText } from '@/lib/audioCache';

export async function POST(req: NextRequest) {
  const { text, language: rawLanguage } = await req.json();
  const language = typeof rawLanguage === 'string' ? rawLanguage : 'english'; // Default to 'english' if not provided or not a string

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }
  try {
    // The 'type' is used for cache key, but we can use a generic one like 'audio'
    const url = await getAudioUrlForText(text, 'audio', language);
    return NextResponse.json({ url, success: true });
  } catch (e) {
    console.error('Audio generation error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to generate audio';
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
