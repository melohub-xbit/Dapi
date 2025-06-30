import { CloudinaryService } from '../services/cloudinaryService';

export async function testCloudinarySetup() {
  try {
    console.log('Testing Cloudinary connection...');
    const result = await CloudinaryService.testConnection();
    
    if (result) {
      console.log('Cloudinary setup is working correctly!');
      return true;
    } else {
      console.log('Cloudinary connection failed');
      return false;
    }
  } catch (error) {
    console.error('Cloudinary test failed:', error);
    return false;
  }
}
