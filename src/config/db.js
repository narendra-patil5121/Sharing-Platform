const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/akatsuki_draft';
    const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

    const opts = {
      serverSelectionTimeoutMS: isLocal ? 3000 : 10000,
    };

    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongooseInstance) => {
        console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance.connection;
      })
      .catch(async (error) => {
        cached.promise = null;

        // If running in development and local MongoDB service is not started, fall back to in-memory MongoDB
        if (
          process.env.NODE_ENV !== 'production' &&
          !process.env.VERCEL &&
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
            return conn.connection;
          } catch (memoryErr) {
            console.error(`Failed to start in-memory database: ${memoryErr.message}`);
          }
        }

        console.error(`Database connection error: ${error.message}`);
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
          process.exit(1);
        }
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
