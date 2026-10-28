const mongoose = require('mongoose');

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/akatsuki_draft';

  try {
    // Attempt connecting to the configured URI (with a short timeout for local connections)
    const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isLocal ? 3000 : 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // If running in development and local MongoDB service is not started, fall back to in-memory MongoDB
    if (
      process.env.NODE_ENV !== 'production' &&
      (error.message.includes('ECONNREFUSED') ||
        error.name === 'MongooseServerSelectionError')
    ) {
      console.warn(`\n[Notice] Local MongoDB is not running (${error.message}).`);
      console.log('🔄 Automatically launching an in-memory MongoDB instance for development...\n');

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const memoryUri = mongoServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ In-Memory MongoDB Connected: ${memoryUri}`);
        console.log('💡 Tip: To use a persistent database, start local MongoDB or provide a MongoDB Atlas URI in .env\n');
        return conn;
      } catch (memoryErr) {
        console.error(`Failed to start in-memory database: ${memoryErr.message}`);
      }
    }

    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
