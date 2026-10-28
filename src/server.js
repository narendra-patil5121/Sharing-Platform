const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to Database immediately for serverless invocations
connectDB();

// Only listen on a port if running locally (Not on production Vercel)
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`Server running locally in development mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections locally
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}

// CRUCIAL: Export the app instance so Vercel can handle routing
module.exports = app;
