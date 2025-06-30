import { NextRequest, NextResponse } from 'next/server';
import { GameSessionService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

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
    const { gameType, contentHash, contentText, gameResults } = body;

    if (!gameType || !contentHash || !contentText || !gameResults) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📊 Submitting game results:', { gameType, contentHash, sessionId });

    // Submit game results
    const result = await GameSessionService.submitGameResults(sessionId, decoded.email, {
      gameType,
      contentType: contentText.includes('→') ? 
        (contentText.split('→')[0].trim().split(' ').length > 3 ? 'sentence' : 'vocabulary') : 'vocabulary',
      contentHash,
      contentText,
      totalAttempts: gameResults.totalAttempts || 1,
      correctOnFirstTry: gameResults.correctOnFirstTry || false,
      timeSpent: gameResults.timeSpent || 0,
      gameSpecificData: gameResults.gameSpecificData || {}
    });

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