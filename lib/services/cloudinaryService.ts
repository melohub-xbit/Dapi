import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are missing. Please check your environment variables.');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    this.initialized = true;
  }

  /**
   * Test connection to Cloudinary
   */
  static async testConnection(): Promise<boolean> {
    this.initialize();

    try {
      // Test with a simple raw file upload
      const testData = Buffer.from('cloudinary-test').toString('base64');
      const result = await cloudinary.uploader.upload(
        `data:text/plain;base64,${testData}`,
        {
          public_id: 'dapi/test/connection-test',
          resource_type: 'raw',
          overwrite: true,
        }
      );

      console.log('Test upload successful:', result.secure_url);

      // Clean up test file
      await cloudinary.uploader.destroy('dapi/test/connection-test', {
        resource_type: 'raw'
      });

      console.log('Cloudinary connection test successful');
      return true;
    } catch (error) {
      console.error('Cloudinary connection test failed:', error);
      return false;
    }
  }


  /**
   * Upload audio buffer to Cloudinary
   * @param audioBuffer - Audio file buffer
   * @param hash - Unique hash for the audio (from vocabulary/sentence)
   * @param language - Language code for organization
   * @returns Cloudinary URL
   */
  static async uploadAudio(
    audioBuffer: Buffer, 
    hash: string, 
    language: string
  ): Promise<string> {
    this.initialize();

    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'video', // Use 'video' for audio files
            public_id: `dapi/audio/${language}/${hash}`,
            format: 'mp3',
            folder: 'dapi/audio',
            tags: ['dapi', 'audio', language],
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(audioBuffer);
      });

      return (result as any).secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload audio to Cloudinary');
    }
  }

  /**
   * Get audio URL by hash
   * @param hash - Audio hash
   * @param language - Language code
   * @returns Cloudinary URL or null if not found
   */
  static getAudioUrl(hash: string, language: string): string {
    this.initialize();
    
    return cloudinary.url(`dapi/audio/${language}/${hash}`, {
      resource_type: 'video',
      format: 'mp3',
    });
  }

  /**
   * Delete audio file
   * @param hash - Audio hash
   * @param language - Language code
   * @returns Success boolean
   */
  static async deleteAudio(hash: string, language: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await cloudinary.uploader.destroy(
        `dapi/audio/${language}/${hash}`,
        { resource_type: 'video' }
      );
      
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Check if audio exists
   * @param hash - Audio hash
   * @param language - Language code
   * @returns Boolean indicating if audio exists
   */
  static async audioExists(hash: string, language: string): Promise<boolean> {
    this.initialize();

    try {
      const result = await cloudinary.api.resource(
        `dapi/audio/${language}/${hash}`,
        { resource_type: 'video' }
      );
      
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get audio file info
   * @param hash - Audio hash
   * @param language - Language code
   * @returns Audio file information
   */
  static async getAudioInfo(hash: string, language: string) {
    this.initialize();

    try {
      const result = await cloudinary.api.resource(
        `dapi/audio/${language}/${hash}`,
        { resource_type: 'video' }
      );
      
      return {
        url: result.secure_url,
        size: result.bytes,
        format: result.format,
        duration: result.duration,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Error getting audio info:', error);
      return null;
    }
  }

  /**
   * Batch upload multiple audio files
   * @param audioFiles - Array of {buffer, hash, language}
   * @returns Array of upload results
   */
  static async batchUploadAudio(
    audioFiles: Array<{
      buffer: Buffer;
      hash: string;
      language: string;
      content: string; // For logging purposes
    }>
  ) {
    const results = [];

    for (const file of audioFiles) {
      try {
        const url = await this.uploadAudio(file.buffer, file.hash, file.language);
        results.push({
          hash: file.hash,
          content: file.content,
          success: true,
          url,
        });
      } catch (error) {
        results.push({
          hash: file.hash,
          content: file.content,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}