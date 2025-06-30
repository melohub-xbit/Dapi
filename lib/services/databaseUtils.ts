import { getDatabase } from '../mongodb';
import { COLLECTIONS } from '../schemas';

export class DatabaseUtils {
  /**
   * Create indexes for better performance
   */
  static async createIndexes() {
    const db = await getDatabase();

    // Scenarios collection indexes
    const scenariosCollection = db.collection(COLLECTIONS.SCENARIOS);
    await scenariosCollection.createIndex({ id: 1 }, { unique: true });
    await scenariosCollection.createIndex({ 'metadata.language': 1 });
    await scenariosCollection.createIndex({ createdAt: -1 });

    // User Scenarios collection indexes
    const userScenariosCollection = db.collection(COLLECTIONS.USER_SCENARIOS);
    await userScenariosCollection.createIndex({ id: 1 }, { unique: true });
    await userScenariosCollection.createIndex({ userEmail: 1 });
    await userScenariosCollection.createIndex({ scenarioId: 1 });
    await userScenariosCollection.createIndex({ userEmail: 1, scenarioId: 1 }, { unique: true });

    // Lessons collection indexes
    const lessonsCollection = db.collection(COLLECTIONS.LESSONS);
    await lessonsCollection.createIndex({ id: 1 }, { unique: true });
    await lessonsCollection.createIndex({ userEmail: 1 });
    await lessonsCollection.createIndex({ scenarioId: 1 });
    await lessonsCollection.createIndex({ userEmail: 1, scenarioId: 1 });
    await lessonsCollection.createIndex({ userEmail: 1, scenarioId: 1, order: 1 });

    console.log('Database indexes created successfully');
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats() {
    const db = await getDatabase();

    const stats = {
      scenarios: await db.collection(COLLECTIONS.SCENARIOS).countDocuments(),
      userScenarios: await db.collection(COLLECTIONS.USER_SCENARIOS).countDocuments(),
      lessons: await db.collection(COLLECTIONS.LESSONS).countDocuments(),
    };

    return stats;
  }

  /**
   * Clean up orphaned data
   */
  static async cleanupOrphanedData() {
    const db = await getDatabase();

    // Remove user scenarios that reference non-existent scenarios
    const userScenariosCollection = db.collection(COLLECTIONS.USER_SCENARIOS);
    const scenariosCollection = db.collection(COLLECTIONS.SCENARIOS);
    
    const userScenarios = await userScenariosCollection.find({}).toArray();
    const scenarioIds = new Set((await scenariosCollection.find({}, { projection: { id: 1 } }).toArray()).map((s: any) => s.id));
    
    const orphanedUserScenarios = userScenarios.filter((us: any) => !scenarioIds.has(us.scenarioId));
    
    if (orphanedUserScenarios.length > 0) {
      await userScenariosCollection.deleteMany({
        id: { $in: orphanedUserScenarios.map((us: any) => us.id) }
      });
      console.log(`Removed ${orphanedUserScenarios.length} orphaned user scenarios`);
    }

    // Remove lessons that reference non-existent scenarios
    const lessonsCollection = db.collection(COLLECTIONS.LESSONS);
    const lessons = await lessonsCollection.find({}).toArray();
    
    const orphanedLessons = lessons.filter((l: any) => !scenarioIds.has(l.scenarioId));
    
    if (orphanedLessons.length > 0) {
      await lessonsCollection.deleteMany({
        id: { $in: orphanedLessons.map((l: any) => l.id) }
      });
      console.log(`Removed ${orphanedLessons.length} orphaned lessons`);
    }

    return {
      orphanedUserScenariosRemoved: orphanedUserScenarios.length,
      orphanedLessonsRemoved: orphanedLessons.length
    };
  }

  /**
   * Validate data integrity
   */
  static async validateDataIntegrity() {
    const db = await getDatabase();
    const issues: string[] = [];

    // Check for duplicate IDs
    const collections = [COLLECTIONS.SCENARIOS, COLLECTIONS.USER_SCENARIOS, COLLECTIONS.LESSONS];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const duplicates = await collection.aggregate([
        { $group: { _id: '$id', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
      
      if (duplicates.length > 0) {
        issues.push(`Duplicate IDs found in ${collectionName}: ${duplicates.map((d: any) => d._id).join(', ')}`);
      }
    }

    // Check for lessons with invalid content references
    const lessons = await db.collection(COLLECTIONS.LESSONS).find({}).toArray();
    
    for (const lesson of lessons) {
      const scenario = await db.collection(COLLECTIONS.SCENARIOS).findOne({ id: (lesson as any).scenarioId });
      
      if (!scenario) {
        issues.push(`Lesson ${(lesson as any).id} references non-existent scenario ${(lesson as any).scenarioId}`);
        continue;
      }

      const vocabularyHashes = new Set((scenario as any).vocabulary.map((v: any) => v.hash));
      const sentenceHashes = new Set((scenario as any).sentences.map((s: any) => s.hash));

      for (const contentItem of (lesson as any).contentItems) {
        if (contentItem.type === 'vocabulary' && !vocabularyHashes.has(contentItem.hash)) {
          issues.push(`Lesson ${(lesson as any).id} references non-existent vocabulary hash ${contentItem.hash}`);
        }
        if (contentItem.type === 'sentence' && !sentenceHashes.has(contentItem.hash)) {
          issues.push(`Lesson ${(lesson as any).id} references non-existent sentence hash ${contentItem.hash}`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
