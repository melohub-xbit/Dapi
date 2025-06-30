import { NextRequest, NextResponse } from 'next/server';
import { GameSessionService } from '@/lib/services';
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
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID required' },
        { status: 400 }
      );
    }

    // Create new game session
    const session = await GameSessionService.createGameSession(
      decoded.email,
      lessonId
    );

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error: any) {
    console.error('Game session creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create game session',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Submit game results
export async function PUT(request: NextRequest) {
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
    const { sessionId, gameResults } = body;

    if (!sessionId || !gameResults) {
      return NextResponse.json(
        { error: 'Session ID and game results required' },
        { status: 400 }
      );
    }

    // Submit game results
    const result = await GameSessionService.submitGameResults(
      sessionId,
      decoded.email,
      gameResults
    );

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Game results submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit game results',
        details: error.message 
      },
      { status: 500 }
    );
  }
}