const express = require('express');
const {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/', getApprovedPosts);

// Protected routes (User/Admin)
router.post('/', protect, createPost);
router.get('/my-posts', protect, getMyPosts);

// Single post operations
router.get('/:id', getPostById);
router.patch('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;

