import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services';
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
    const { language, purpose, userInput, previousInputs = [] } = body;

    // Validate input
    if (!language || !purpose || !userInput) {
      return NextResponse.json(
        { error: 'Language, purpose, and user input are required' },
        { status: 400 }
      );
    }

    console.log(`💬 Generating clarification for: ${userInput}`);

    // Generate clarification using Gemini
    const clarification = await ContentGenerationService.generateClarification(
      language,
      purpose,
      userInput,
      previousInputs
    );

    return NextResponse.json({
      success: true,
      clarification
    });

  } catch (error: any) {
    console.error('Clarification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate clarification',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
