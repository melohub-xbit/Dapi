import { NextRequest, NextResponse } from 'next/server';
import { testCloudinarySetup } from '@/lib/utils/testCloudinary';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting Cloudinary test...');
    const result = await testCloudinarySetup();
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Cloudinary test passed successfully!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cloudinary test failed'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error.message
    }, { status: 500 });
  }
}