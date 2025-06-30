import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services';
import { z } from 'zod';

const createScenarioSchema = z.object({
  language: z.string(),
  purpose: z.string(),
  focus: z.string(),
  userEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createScenarioSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { language, purpose, focus, userEmail } = validation.data;

    console.log(`🚀 Creating scenario for user ${userEmail}: ${language} - ${purpose}`);

    // Generate complete scenario with lessons and audio
    const result = await ContentGenerationService.generateCompleteScenarioWithLessons(
      userEmail,
      language,
      purpose,
      focus
    );

    console.log(`✅ Scenario creation complete:`, {
      scenarioId: result.scenario.id,
      lessonsCreated: result.lessons.length
    });

    return NextResponse.json({
      success: true,
      message: 'Scenario created successfully with lessons',
      data: {
        scenario: {
          id: result.scenario.id,
          metadata: result.scenario.metadata
        },
        lessons: result.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.name,
          difficulty: lesson.order,
          contentCount: lesson.contentItems.length
        }))
      }
    });

  } catch (error: any) {
    console.error('Scenario creation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create scenario';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error';
      statusCode = 503;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Service temporarily unavailable due to rate limits';
      statusCode = 429;
    } else if (error.message.includes('quota')) {
      errorMessage = 'Service quota exceeded';
      statusCode = 429;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}