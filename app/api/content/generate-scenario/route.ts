import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get auth token
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

    // Get request body
    const body = await request.json();
    const { language, purpose, focus } = body;

    // Validate input
    if (!language || !purpose || !focus) {
      return NextResponse.json(
        { error: 'Missing required fields: language, purpose, focus' },
        { status: 400 }
      );
    }

    // Generate complete lesson
    console.log(`🚀 Starting lesson generation for user ${decoded.email}`);
    const result = await ContentGenerationService.generateCompleteScenarioWithLessons(
      decoded.email,
      language,
      purpose,
      focus
    );

    return NextResponse.json({
      success: true,
      message: 'Lesson generated successfully',
      data: result
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