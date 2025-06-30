const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'dapi_language_learning';

async function setupDatabase() {
  console.log('🗄️  Setting up DAPI database...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Create collections
    const collections = ['users', 'scenarios', 'user_scenarios', 'lessons'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection ${collectionName} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    console.log('📊 Creating indexes...');
    
    // Users indexes
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    
    // Scenarios indexes
    await db.collection('scenarios').createIndex({ id: 1 }, { unique: true });
    await db.collection('scenarios').createIndex({ 'metadata.language': 1 });
    await db.collection('scenarios').createIndex({ createdAt: -1 });
    
    // User scenarios indexes
    await db.collection('user_scenarios').createIndex({ id: 1 }, { unique: true });
    await db.collection('user_scenarios').createIndex({ userEmail: 1 });
    await db.collection('user_scenarios').createIndex({ scenarioId: 1 });
    await db.collection('user_scenarios').createIndex({ userEmail: 1, scenarioId: 1 }, { unique: true });
    
    // Lessons indexes
    await db.collection('lessons').createIndex({ id: 1 }, { unique: true });
    await db.collection('lessons').createIndex({ userEmail: 1 });
    await db.collection('lessons').createIndex({ scenarioId: 1 });
    await db.collection('lessons').createIndex({ userEmail: 1, scenarioId: 1, order: 1 });
    
    console.log('✅ All indexes created successfully');
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupDatabase();