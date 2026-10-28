const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler, AppError } = require('./middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root & Health check routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Akatsuki's Draft API - AI-Enabled Content Sharing Platform",
    version: '1.0.0',
    documentation: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'],
      posts: [
        'POST /posts',
        'GET /posts',
        'GET /posts/:id',
        'GET /posts/my-posts',
        'PATCH /posts/:id',
        'DELETE /posts/:id',
      ],
      admin: [
        'GET /admin/posts/pending',
        'PATCH /admin/posts/approve/:id',
        'PATCH /admin/posts/reject/:id',
      ],
      ai: ['POST /ai/improve/:postId'],
      health: 'GET /health',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount API Routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin/posts', adminRoutes);
app.use('/ai', aiRoutes);

// Handle unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
