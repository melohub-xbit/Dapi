import { NextRequest, NextResponse } from 'next/server';
import { UserScenarioService, LessonService } from '@/lib/services';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params;
    console.log('🔍 Looking for scenarioId:', scenarioId);

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

    console.log('👤 User ID:', decoded.email);

    // Get specific scenario with content
    const scenario = await UserScenarioService.getUserScenarioWithData(
      decoded.email,
      scenarioId
    );

    console.log('🎯 Found scenario:', !!scenario);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found or access denied' },
        { status: 404 }
      );
    }

    // Get lessons for this scenario
    console.log('📚 Fetching lessons for scenario:', scenarioId);
    const lessons = await LessonService.getUserScenarioLessons(decoded.email, scenarioId);
    console.log('📚 Found lessons:', lessons.length);

    // Combine scenario data with lessons
    const scenarioWithLessons = {
      ...scenario.scenario, // The actual scenario data
      lessons: lessons.map(lesson => ({
        id: lesson.id,
        name: lesson.name,
        order: lesson.order,
        contentItems: lesson.contentItems,
        score: lesson.score || 0,
      }))
    };

    return NextResponse.json({
      success: true,
      scenario: scenarioWithLessons
    });

  } catch (error: any) {
    console.error('Get scenario error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get scenario',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
