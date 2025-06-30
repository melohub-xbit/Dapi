import { getDatabase } from '../mongodb';
import { Scenario, CreateScenarioInput, COLLECTIONS } from '../schemas';
import { ObjectId } from 'mongodb';

export class ScenarioService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<Scenario>(COLLECTIONS.SCENARIOS);
  }

  /**
   * Create a new scenario from Gemini JSON data
   */
  static async createScenario(scenarioData: CreateScenarioInput, userEmail: string): Promise<Scenario> {
    const collection = await this.getCollection();
    
    const scenario: Scenario = {
      id: new ObjectId().toString(), // Generate unique ID
      userEmail: userEmail,
      metadata: scenarioData.metadata,
      vocabulary: scenarioData.vocabulary,
      sentences: scenarioData.sentences,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(scenario);
    
    return {
      ...scenario,
      _id: result.insertedId,
    };
  }

  /**
   * Get scenario by ID
   */
  static async getScenarioById(scenarioId: string): Promise<Scenario | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ id: scenarioId });
  }

  /**
   * Get all scenarios for a user
   */
  static async getScenariosByUser(userEmail: string): Promise<Scenario[]> {
    const collection = await this.getCollection();
    return await collection.find({ userEmail: userEmail }).toArray();
  }

  /**
   * Get all scenarios
   */
  static async getAllScenarios(): Promise<Scenario[]> {
    const collection = await this.getCollection();
    return await collection.find({}).toArray();
  }

  /**
   * Get scenarios by language
   */
  static async getScenariosByLanguage(language: string): Promise<Scenario[]> {
    const collection = await this.getCollection();
    return await collection.find({ 'metadata.language': language }).toArray();
  }

  /**
   * Update scenario
   */
  static async updateScenario(scenarioId: string, updateData: Partial<CreateScenarioInput>): Promise<Scenario | null> {
    const collection = await this.getCollection();
    
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.metadata) updateFields.metadata = updateData.metadata;
    if (updateData.vocabulary) updateFields.vocabulary = updateData.vocabulary;
    if (updateData.sentences) updateFields.sentences = updateData.sentences;

    const result = await collection.findOneAndUpdate(
      { id: scenarioId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Delete scenario
   */
  static async deleteScenario(scenarioId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ id: scenarioId });
    return result.deletedCount > 0;
  }

  /**
   * Get vocabulary item by hash from scenario
   */
  static async getVocabularyByHash(scenarioId: string, hash: string) {
    const collection = await this.getCollection();
    const scenario = await collection.findOne(
      { id: scenarioId },
      { projection: { vocabulary: 1 } }
    );
    
    if (!scenario) return null;
    return scenario.vocabulary.find(item => item.hash === hash) || null;
  }

  /**
   * Get sentence item by hash from scenario
   */
  static async getSentenceByHash(scenarioId: string, hash: string) {
    const collection = await this.getCollection();
    const scenario = await collection.findOne(
      { id: scenarioId },
      { projection: { sentences: 1 } }
    );
    
    if (!scenario) return null;
    return scenario.sentences.find(item => item.hash === hash) || null;
  }

  /**
   * Get content items by hashes (mixed vocabulary and sentences)
   */
  static async getContentByHashes(scenarioId: string, hashes: string[]) {
    const collection = await this.getCollection();
    const scenario = await collection.findOne(
      { id: scenarioId },
      { projection: { vocabulary: 1, sentences: 1 } }
    );
    
    if (!scenario) return [];

    const results = [];
    
    for (const hash of hashes) {
      const vocab = scenario.vocabulary.find(item => item.hash === hash);
      if (vocab) {
        results.push({ ...vocab, type: 'vocabulary' });
        continue;
      }
      
      const sentence = scenario.sentences.find(item => item.hash === hash);
      if (sentence) {
        results.push({ ...sentence, type: 'sentence' });
      }
    }
    
    return results;
  }
}