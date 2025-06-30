import { GeminiService } from './geminiService';
import { ElevenLabsService } from './elevenLabsService';
import { CloudinaryService } from './cloudinaryService';
import { ScenarioService } from './scenarioService';
import { UserScenarioService } from './userScenarioService';
import { LessonService } from './lessonService';
import { Scenario, Lesson } from '../schemas';

export class ContentGenerationService {
  /**
   * Generate complete scenario with pre-planned lessons
   */
  static async generateCompleteScenarioWithLessons(
    userEmail: string,
    language: string,
    purpose: string,
    focus: string
  ) {
    console.log(`📚 Generating complete scenario for user ${userEmail}`);
    
    // Step 1: Generate scenario content
    const scenarioData = await this.generateScenarioContent(language, purpose, focus);
    
    // Step 2: Save scenario to database
    const scenario = await ScenarioService.createScenario(scenarioData, userEmail);
    console.log(`✅ Scenario created: ${scenario.id}`);
    
    // Step 3: Link user to scenario
    await UserScenarioService.createUserScenario({
      userEmail,
      scenarioId: scenario.id
    });
    console.log(`🔗 User linked to scenario`);
    
    // Step 4: Generate all 4 lessons
    const lessons = await this.generateAllLessons(userEmail, scenario);
    console.log(`📖 Generated ${lessons.length} lessons`);
    
    
    
    return {
      scenario,
      lessons
    };
  }

  /**
   * Generate clarification using Gemini
   */
  static async generateClarification(
    language: string,
    purpose: string,
    userInput: string,
    previousInputs: string[] = []
  ): Promise<string> {
    return GeminiService.generateClarification(language, purpose, userInput, previousInputs);
  }

  /**
   * Generate scenario content using Gemini
   */
  private static async generateScenarioContent(
    language: string,
    purpose: string,
    focus: string
  ): Promise<any> {
    console.log(`🧠 Generating content with Gemini...`);
    
    const content = await GeminiService.generateLessonContent(language, purpose, focus);
    
    return {
      metadata: {
        language,
        purpose,
        focus,
        generatedAt: new Date(),
        totalWords: content.vocabulary.length,
        totalSentences: content.sentences.length
      },
      vocabulary: content.vocabulary,
      sentences: content.sentences
    };
  }

  /**
   * Generate all 4 lessons according to the specification
   */
  private static async generateAllLessons(userEmail: string, scenario: Scenario): Promise<Lesson[]> {
    const lessons: Lesson[] = [];
    
    // Lesson structure: 
    // Lessons 1-3: 5 words + 5 sentences each
    // Lesson 4: 15 words + 5 sentences
    const lessonPlans = [
      { lessonNumber: 1, vocabCount: 5, sentenceCount: 5, allowedWordGames: ['mahjong', 'word-sprint'] },
      { lessonNumber: 2, vocabCount: 5, sentenceCount: 5, allowedWordGames: ['mahjong', 'word-sprint'] },
      { lessonNumber: 3, vocabCount: 5, sentenceCount: 5, allowedWordGames: ['mahjong', 'word-sprint'] },
      { lessonNumber: 4, vocabCount: 15, sentenceCount: 5, allowedWordGames: ['mahjong'] } // Only mahjong for lesson 4
    ];

    let usedVocabHashes = new Set<string>();
    let usedSentenceHashes = new Set<string>();

    for (const plan of lessonPlans) {
      // Select vocabulary (avoid already used)
      const availableVocab = scenario.vocabulary.filter(v => !usedVocabHashes.has(v.hash));
      const selectedVocab = availableVocab.slice(0, plan.vocabCount);
      selectedVocab.forEach(v => usedVocabHashes.add(v.hash));

      // Select sentences (avoid already used)
      const availableSentences = scenario.sentences.filter(s => !usedSentenceHashes.has(s.hash));
      const selectedSentences = availableSentences.slice(0, plan.sentenceCount);
      selectedSentences.forEach(s => usedSentenceHashes.add(s.hash));

      // Create content items with game restrictions
      const contentItems = [
        ...selectedVocab.map((vocab, index) => ({
          hash: vocab.hash,
          type: 'vocabulary' as const,
          order: index + 1,
          allowedGames: plan.allowedWordGames
        })),
        ...selectedSentences.map((sentence, index) => ({
          hash: sentence.hash,
          type: 'sentence' as const,
          order: selectedVocab.length + index + 1,
          allowedGames: ['target-translation', 'puzzle-builder', 'audio-catch'] // All sentence games allowed
        }))
      ];

      // Shuffle content items for mixed learning
      const shuffledContent = contentItems.sort(() => Math.random() - 0.5)
        .map((item, index) => ({ ...item, order: index + 1 }));

      // Create lesson
      const lesson = await LessonService.createLesson({
        userEmail,
        scenarioId: scenario.id,
        title: `${scenario.metadata.language} Lesson ${plan.lessonNumber}`,
        description: `Learning ${plan.vocabCount} words and ${plan.sentenceCount} sentences`,
        contentItems: shuffledContent,
        order: plan.lessonNumber,
        difficulty: plan.lessonNumber <= 2 ? 'beginner' : plan.lessonNumber === 3 ? 'intermediate' : 'advanced',
        estimatedDuration: this.calculateLessonDuration(plan.vocabCount, plan.sentenceCount),
        gameRestrictions: {
          vocabularyGames: plan.allowedWordGames,
          sentenceGames: ['target-translation', 'puzzle-builder', 'audio-catch']
        }
      });

      lessons.push(lesson);
      console.log(`📖 Created Lesson ${plan.lessonNumber}: ${plan.vocabCount} words, ${plan.sentenceCount} sentences`);
    }

    return lessons;
  }

  /**
   * Calculate estimated lesson duration
   */
  private static calculateLessonDuration(vocabCount: number, sentenceCount: number): number {
    // Estimate: 45 seconds per vocab word, 60 seconds per sentence
    return (vocabCount * 45) + (sentenceCount * 60);
  }

  

  /**
   * Test all services connectivity
   */
  static async testAllServices() {
    console.log('🧪 Testing all services...');
    
    const results = {
      gemini: false,
      elevenLabs: false,
      cloudinary: false
    };

    try {
      // Test Gemini
      await GeminiService.testConnection();
      results.gemini = true;
      console.log('✅ Gemini service working');
    } catch (error) {
      console.error('❌ Gemini service failed:', error);
    }

    try {
      // Test ElevenLabs
      results.elevenLabs = await ElevenLabsService.testConnection();
      console.log('✅ ElevenLabs service working');
    } catch (error) {
      console.error('❌ ElevenLabs service failed:', error);
    }

    try {
      // Test Cloudinary
      results.cloudinary = await CloudinaryService.testConnection();
      console.log('✅ Cloudinary service working');
    } catch (error) {
      console.error('❌ Cloudinary service failed:', error);
    }

    return results;
  }
}
