import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService, LessonService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { language, purpose, focus } = body;

    if (!language || !purpose || !focus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting scenario generation for user ${decoded.email}`);
    console.log(`📚 Language: ${language}, Purpose: ${purpose}`);
    console.log(`🎯 Focus: ${focus}`);

    // Generate complete scenario with lessons
    const result = await ContentGenerationService.generateCompleteScenarioWithLessons(
      decoded.email,
      language,
      purpose,
      focus
    );

    return NextResponse.json({
      success: true,
      scenario: result.scenario,
      lessons: result.lessons,
      summary: {
        vocabularyCount: result.scenario.vocabulary.length,
        sentenceCount: result.scenario.sentences.length,
        lessonsGenerated: result.lessons.length
      }
    });

  } catch (error: any) {
    console.error('Scenario generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate scenario',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
