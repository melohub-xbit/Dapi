import { ElevenLabsService } from './services/elevenLabsService';
import { CloudinaryService } from './services/cloudinaryService';
import { generateHash } from './utils/helpers';

export async function getAudioUrlForText(text: string, type: string, language: string): Promise<string> {
  const hash = generateHash(text, language);

  // 1. Check if audio exists in Cloudinary
  const exists = await CloudinaryService.audioExists(hash, language);
  if (exists) {
    console.log(`✅ Audio found in Cloudinary for hash: ${hash}`);
    return CloudinaryService.getAudioUrl(hash, language);
  }

  console.log(`🎵 Generating audio for text: "${text.substring(0, 30)}..." in ${language}`);
  // 2. Generate audio using ElevenLabs
  const audioBuffer = await ElevenLabsService.generateAudio(text, language);

  // 3. Upload audio to Cloudinary
  console.log(`☁️ Uploading audio to Cloudinary for hash: ${hash}`);
  const cloudinaryUrl = await CloudinaryService.uploadAudio(audioBuffer, hash, language);

  return cloudinaryUrl;
}