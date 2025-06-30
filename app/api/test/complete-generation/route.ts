import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail = 'test@example.com', language = 'Spanish', purpose = 'Travel to Spain', focus = 'Ordering food at restaurants' } = body;

    console.log('🧪 Testing complete content generation pipeline...');
    
    const result = await ContentGenerationService.generateCompleteScenarioWithLessons(
      userEmail,
      language,
      purpose,
      focus
    );

    return NextResponse.json({
      success: true,
      message: 'Complete generation test successful!',
      result: result
    });

  } catch (error: any) {
    console.error('Complete generation test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Complete generation test failed',
      error: error.message
    }, { status: 500 });
  }
}