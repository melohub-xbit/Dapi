import { NextRequest, NextResponse } from 'next/server';
import { GameSessionService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> } // Changed this line
) {
  try {
    // Await params before using
    const { sessionId } = await params; // Added this line

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

    // Complete the game session and generate lesson performance - now using awaited sessionId
    const lessonPerformance = await GameSessionService.completeGameSession(
      sessionId, // Now using the awaited value
      decoded.email
    );

    return NextResponse.json({
      success: true,
      lessonPerformance
    });

  } catch (error) {
    console.error('Game session completion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete game session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
