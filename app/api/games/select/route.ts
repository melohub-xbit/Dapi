import { NextRequest, NextResponse } from 'next/server';
import { LessonService } from '@/lib/services';
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
    const { lessonId, contentHash, contentType } = body;

    if (!lessonId || !contentHash || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get lesson with game restrictions
    const lesson = await LessonService.getLessonForGameplay(lessonId);
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Verify user owns this lesson
    if (lesson.userEmail !== decoded.email) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Find the content item
    const contentArray = contentType === 'vocabulary' ? lesson.gameContent.vocabulary : lesson.gameContent.sentences;
    const contentItem = contentArray.find((item: any) => item.hash === contentHash);

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content not found in lesson' },
        { status: 404 }
      );
    }

    // Get allowed games from the content item
    const allowedGames = contentItem.allowedGames || ['target-translation'];
    const selectedGame = allowedGames[Math.floor(Math.random() * allowedGames.length)];

    // Prepare game data in the format expected by the games
    const gameData: any = {
      gameType: selectedGame,
      contentType,
      currentContent: contentItem,
      lessonContext: {
        lessonId: lesson.id,
        lessonTitle: lesson.name,
        difficulty: lesson.difficulty || 'beginner',
        language: lesson.scenario?.metadata?.language || 'unknown'
      },
      // Provide all lesson content for games that need it
      lessonContent: {
        vocabulary: lesson.gameContent.vocabulary || [],
        sentences: lesson.gameContent.sentences || []
      }
    };

    // For target-translation, generate options
    if (selectedGame === 'target-translation') {
      gameData.options = generateTargetTranslationOptions(
        lesson,
        contentItem,
        contentType
      );
      gameData.challenge = {
        id: lessonId,
        question: contentItem.word || contentItem.sentence,
        pronunciation: contentItem.phonetic,
        correctAnswer: contentItem.translation,
        options: gameData.options,
        difficulty: lesson.difficulty || 'medium',
        points: 100
      };
    }

    return NextResponse.json({
      success: true,
      gameData
    });

  } catch (error: any) {
    console.error('Game selection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to select game',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function generateTargetTranslationOptions(
  lesson: any,
  currentContent: any,
  contentType: string
): string[] {
  const options = [currentContent.translation]; // Correct answer

  // Get pool of other content for wrong answers
  const contentPool = contentType === 'vocabulary' 
    ? lesson.gameContent?.vocabulary || []
    : lesson.gameContent?.sentences || [];

  // Filter out current content and get random wrong answers
  const wrongAnswers = contentPool
    .filter((item: any) => item.hash !== currentContent.hash)
    .map((item: any) => item.translation)
    .filter((translation: string) => translation && translation !== currentContent.translation)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  options.push(...wrongAnswers);

  // Ensure we have at least 4 options
  while (options.length < 4) {
    options.push(`Option ${options.length}`);
  }

  // Shuffle all options
  return options.sort(() => Math.random() - 0.5);
}
