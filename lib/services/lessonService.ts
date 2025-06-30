import { getDatabase } from '../mongodb';
import { Lesson, COLLECTIONS } from '../schemas';
import { ObjectId } from 'mongodb';
import { ScenarioService } from './scenarioService';

export interface CreateLessonInput {
  userEmail: string;
  scenarioId: string;
  title: string;
  description?: string;
  contentItems: Array<{
    hash: string;
    type: 'vocabulary' | 'sentence';
    order: number;
    allowedGames: string[];
  }>;
  order: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  gameRestrictions?: {
    vocabularyGames: string[];
    sentenceGames: string[];
  };
}

export class LessonService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<Lesson>(COLLECTIONS.LESSONS);
  }

  /**
   * Get default allowed games based on content type
   */
  private static getDefaultAllowedGames(contentType: 'vocabulary' | 'sentence'): string[] {
    if (contentType === 'vocabulary') {
      return ['mahjong', 'word-sprint', 'target-translation'];
    } else {
      return ['target-translation', 'puzzle-builder', 'audio-catch'];
    }
  }

  /**
   * Create a new lesson
   */
  static async createLesson(data: CreateLessonInput): Promise<Lesson> {
    const collection = await this.getCollection();
    
    const lesson: Lesson = {
      id: new ObjectId().toString(),
      userEmail: data.userEmail,
      scenarioId: data.scenarioId,
      name: data.title,
      description: data.description,
      contentItems: data.contentItems.map(item => ({
        hash: item.hash,
        type: item.type,
        order: item.order,
        allowedGames: item.allowedGames.length > 0 
          ? item.allowedGames 
          : this.getDefaultAllowedGames(item.type) // Use defaults if none provided
      })),
      order: data.order,
      difficulty: data.difficulty || 'beginner',
      estimatedDuration: data.estimatedDuration,
      score: 0,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(lesson);
    
    return {
      ...lesson,
      _id: result.insertedId,
    };
  }

  /**
   * Get lesson with full content data for gameplay
   */
  static async getLessonForGameplay(lessonId: string): Promise<any> {
    const collection = await this.getCollection();
    const lesson = await collection.findOne({ id: lessonId });

    if (!lesson) {
      return null;
    }

    const scenario = await ScenarioService.getScenarioById(lesson.scenarioId);

    if (!scenario) {
      throw new Error(`Scenario not found for lesson ${lessonId}`);
    }

    const vocabMap = new Map(scenario.vocabulary.map(v => [v.hash, v]));
    const sentenceMap = new Map(scenario.sentences.map(s => [s.hash, s]));

    const gameContent: { vocabulary: any[], sentences: any[] } = {
      vocabulary: [],
      sentences: []
    };

    for (const item of lesson.contentItems) {
      if (item.type === 'vocabulary') {
        const vocabItem = vocabMap.get(item.hash);
        if (vocabItem) {
          gameContent.vocabulary.push({ ...item, ...vocabItem });
        }
      } else if (item.type === 'sentence') {
        const sentenceItem = sentenceMap.get(item.hash);
        if (sentenceItem) {
          gameContent.sentences.push({ ...item, ...sentenceItem });
        }
      }
    }
    
    // sort by order
    gameContent.vocabulary.sort((a, b) => a.order - b.order);
    gameContent.sentences.sort((a, b) => a.order - b.order);


    return {
      ...lesson,
      gameContent,
      scenario: {
        metadata: scenario.metadata
      }
    };
  }

  /**
   * Get user's lessons for a scenario
   */
  static async getUserScenarioLessons(userEmail: string, scenarioId: string): Promise<Lesson[]> {
    const collection = await this.getCollection();
    return await collection
      .find({ userEmail, scenarioId })
      .sort({ order: 1 })
      .toArray();
  }

  /**
   * Get next available lesson for user
   */
  static async getNextLesson(userEmail: string, scenarioId: string): Promise<Lesson | null> {
    const collection = await this.getCollection();
    
    return await collection.findOne(
      { userEmail, scenarioId },
      { sort: { order: 1 } }
    );
  }

  /**
   * Update lesson progress/completion
   */
  static async updateLessonProgress(
    lessonId: string, 
    progressData: {
      completed?: boolean;
      lastPlayedAt?: Date;
      bestScore?: number;
      totalAttempts?: number;
    }
  ): Promise<boolean> {
    const collection = await this.getCollection();
    
    const result = await collection.updateOne(
      { id: lessonId },
      { 
        $set: {
          ...progressData,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }
}

