import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing all services...');
    
    const results = await ContentGenerationService.testAllServices();
    
    const allWorking = Object.values(results).every(Boolean);
    
    return NextResponse.json({
      success: allWorking,
      message: allWorking ? 'All services are working!' : 'Some services have issues',
      services: {
        gemini: {
          status: results.gemini ? 'working' : 'failed',
          description: 'AI content generation service'
        },
        elevenLabs: {
          status: results.elevenLabs ? 'working' : 'failed',
          description: 'Text-to-speech audio generation'
        },
        cloudinary: {
          status: results.cloudinary ? 'working' : 'failed',
          description: 'Audio file storage and delivery'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Service test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Service test failed',
      error: error.message
    }, { status: 500 });
  }
}