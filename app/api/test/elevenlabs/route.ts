import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenLabsService';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing ElevenLabs...');
    const result = await ElevenLabsService.testConnection();
    
    return NextResponse.json({
      success: result,
      message: result ? 'ElevenLabs test successful!' : 'ElevenLabs test failed'
    });
  } catch (error: any) {
    console.error('ElevenLabs test error:', error);
    return NextResponse.json({
      success: false,
      message: 'ElevenLabs test failed',
      error: error.message
    }, { status: 500 });
  }
}