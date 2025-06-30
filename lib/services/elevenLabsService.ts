export class ElevenLabsService {
  private static readonly API_KEY = process.env.ELEVENLABS_API_KEY;
  private static readonly BASE_URL = 'https://api.elevenlabs.io/v1';
  
  // Voice configurations for different languages
  private static readonly VOICE_CONFIGS = {
    spanish: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - good for Spanish
      model: 'eleven_multilingual_v2'
    },
    french: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - good for French
      model: 'eleven_multilingual_v2'
    },
    german: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - good for German
      model: 'eleven_multilingual_v2'
    },
    italian: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - good for Italian
      model: 'eleven_multilingual_v2'
    },
    portuguese: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - good for Portuguese
      model: 'eleven_multilingual_v2'
    },
    japanese: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - multilingual
      model: 'eleven_multilingual_v2'
    },
    english: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - native English
      model: 'eleven_monolingual_v1'
    }
  };

  /**
   * Generate audio from text using ElevenLabs TTS with language-specific settings
   */
  static async generateAudio(text: string, language: string = 'english'): Promise<Buffer> {
    if (!this.API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not defined');
    }

    const langKey = language.toLowerCase() as keyof typeof this.VOICE_CONFIGS;
    const voiceConfig = this.VOICE_CONFIGS[langKey] || this.VOICE_CONFIGS.english;

    const url = `${this.BASE_URL}/text-to-speech/${voiceConfig.voiceId}`;

    const requestBody = {
      text: text,
      model_id: voiceConfig.model,
      voice_settings: {
        stability: language === 'english' ? 0.5 : 0.6, // Slightly more stable for foreign languages
        similarity_boost: language === 'english' ? 0.5 : 0.7, // Higher similarity for foreign languages
        style: 0.0, // Neutral style
        use_speaker_boost: true
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Audio generated (${language}): "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      
      return audioBuffer;
    } catch (error) {
      console.error(`❌ Audio generation failed for: "${text}" (${language})`, error);
      throw error;
    }
  }

  /**
   * Generate audio for multiple texts in batch with intelligent rate limiting
   */
  static async batchGenerateAudio(
    texts: Array<{ text: string; hash: string; type: 'vocabulary' | 'sentence'; language: string }>,
    onProgress?: (completed: number, total: number) => void
  ) {
    const results = [];
    const batchSize = 3; // Smaller batches to avoid rate limiting
    const delayBetweenRequests = 500; // 500ms delay between requests
    const delayBetweenBatches = 2000; // 2s delay between batches

    console.log(`🎵 Starting batch audio generation: ${texts.length} files`);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`🎵 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);

      for (const item of batch) {
        try {
          const audioBuffer = await this.generateAudio(item.text, item.language);
          results.push({
            hash: item.hash,
            text: item.text,
            type: item.type,
            language: item.language,
            success: true,
            audioBuffer,
          });

          // Progress callback
          if (onProgress) {
            onProgress(results.length, texts.length);
          }
          
          // Delay between individual requests
          if (batch.indexOf(item) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
        } catch (error) {
          console.error(`❌ Failed to generate audio for: "${item.text}"`, error);
          results.push({
            hash: item.hash,
            text: item.text,
            type: item.type,
            language: item.language,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Delay between batches (except for the last batch)
      if (i + batchSize < texts.length) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`🎵 Batch audio generation complete: ${successCount} success, ${errorCount} errors`);

    return {
      results,
      stats: {
        total: texts.length,
        success: successCount,
        errors: errorCount,
        successRate: (successCount / texts.length) * 100
      }
    };
  }

  /**
   * Test ElevenLabs connection and voice quality
   */
  static async testConnection(language: string = 'english'): Promise<boolean> {
    try {
      const testPhrases = {
        english: 'Hello, this is a test of the ElevenLabs text to speech system.',
        spanish: 'Hola, esta es una prueba del sistema de texto a voz.',
        french: 'Bonjour, ceci est un test du système de synthèse vocale.',
        german: 'Hallo, dies ist ein Test des Text-zu-Sprache-Systems.',
        italian: 'Ciao, questo è un test del sistema di sintesi vocale.',
        portuguese: 'Olá, este é um teste do sistema de texto para fala.',
        japanese: 'こんにちは、これはテキスト読み上げシステムのテストです。'
      };

      const testText = testPhrases[language as keyof typeof testPhrases] || testPhrases.english;
      const testAudio = await this.generateAudio(testText, language);
      
      console.log(`✅ ElevenLabs connection test passed for ${language}`);
      return testAudio.length > 1000; // Ensure we got a reasonable audio file
    } catch (error) {
      console.error(`❌ ElevenLabs connection test failed for ${language}:`, error);
      return false;
    }
  }

  /**
   * Get available voices (for future expansion)
   */
  static async getAvailableVoices(): Promise<any[]> {
    if (!this.API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not defined');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/voices`, {
        headers: {
          'xi-api-key': this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch available voices:', error);
      return [];
    }
  }

  /**
   * Get account usage information
   */
  static async getUsageInfo(): Promise<any> {
    if (!this.API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not defined');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/user`, {
        headers: {
          'xi-api-key': this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const data = await response.json();
      return {
        charactersUsed: data.subscription?.character_count || 0,
        charactersLimit: data.subscription?.character_limit || 0,
        resetDate: data.subscription?.next_character_count_reset_unix || null
      };
    } catch (error) {
      console.error('Failed to fetch usage info:', error);
      return null;
    }
  }
}
