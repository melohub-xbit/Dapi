import { getDatabase } from '../mongodb';
import { UserScenario, CreateUserScenarioInput, COLLECTIONS } from '../schemas';
import { ObjectId } from 'mongodb';

export class UserScenarioService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<UserScenario>(COLLECTIONS.USER_SCENARIOS);
  }

  static async createUserScenario(input: CreateUserScenarioInput): Promise<UserScenario> {
    const collection = await this.getCollection();
    const now = new Date();
    const newUserScenario: UserScenario = {
      ...input,
      progress: 0,
      gamesWon: 0,
      totalScore: 0,
      lastPlayed: now,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(newUserScenario as any);
    return { ...newUserScenario, _id: result.insertedId };
  }

  static async updateUserScenario(
    userEmail: string,
    scenarioId: string,
    updates: Partial<UserScenario>
  ): Promise<UserScenario | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { userEmail, scenarioId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  }
    /**
   * Get a specific user scenario with full data
   */
  static async getUserScenarioWithData(userEmail: string, scenarioId: string) {
    const db = await getDatabase();
    
    const pipeline = [
      { $match: { userEmail, scenarioId } },
      {
        $lookup: {
          from: COLLECTIONS.SCENARIOS,
          localField: 'scenarioId',
          foreignField: 'id',
          as: 'scenario'
        }
      },
      { $unwind: '$scenario' },
      {
        $project: {
          id: "$id",
          userEmail: "$userEmail",
          scenarioId: "$scenarioId",
          createdAt: 1,
          updatedAt: 1,
          scenario: 1
        }
      }
    ];

    const result = await db.collection(COLLECTIONS.USER_SCENARIOS).aggregate(pipeline).toArray();
    return result.length > 0 ? result[0] : null;
  }
}