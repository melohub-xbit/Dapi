import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';
import { LessonService } from './lessonService';
import { UserScenarioService } from './userScenarioService';

export interface GameSession {
  _id?: ObjectId;
  id: string;
  userEmail: string;
  lessonId: string;
  startedAt: Date;
  completedAt?: Date;
  gameResults: any[];
  status: 'active' | 'completed';
}

export class GameSessionService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<GameSession>('game_sessions');
  }

  static async createGameSession(userEmail: string, lessonId: string): Promise<GameSession> {
    const collection = await this.getCollection();
    
    const session: GameSession = {
      id: new ObjectId().toString(),
      userEmail,
      lessonId,
      startedAt: new Date(),
      gameResults: [],
      status: 'active'
    };

    const result = await collection.insertOne(session);
    
    return {
      ...session,
      _id: result.insertedId,
    };
  }

  static async submitGameResults(sessionId: string, userEmail: string, gameResults: any): Promise<boolean> {
    const collection = await this.getCollection();
    
    const result = await collection.updateOne(
      { id: sessionId, userEmail },
      { 
        $push: { gameResults },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  static async completeGameSession(sessionId: string, userEmail: string): Promise<any> {
    const collection = await this.getCollection();
    const session = await collection.findOne({ id: sessionId, userEmail });

    if (!session) {
      throw new Error('Game session not found');
    }

    const lesson = await LessonService.getLessonForGameplay(session.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const totalScore = session.gameResults.reduce((acc, result) => acc + (result.score || 0), 0);
    const gamesWon = session.gameResults.filter(result => result.isCorrect).length;

    await UserScenarioService.updateUserScenario(userEmail, lesson.scenarioId, {
      totalScore: totalScore,
      gamesWon: gamesWon,
      lastPlayed: new Date(),
    });
    
    const result = await collection.updateOne(
      { id: sessionId, userEmail },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date()
        }
      }
    );

    // Return some lesson performance data
    return {
      sessionId,
      completedAt: new Date(),
      status: 'completed'
    };
  }
}