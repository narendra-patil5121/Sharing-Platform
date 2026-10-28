const Post = require('../models/Post');
const { AppError } = require('../middlewares/errorHandler');

// @desc    Get all pending posts
// @route   GET /admin/posts/pending
// @access  Protected (Admin Only)
const getPendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a post
// @route   PATCH /admin/posts/approve/:id
// @access  Protected (Admin Only)
const approvePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Post not found.', 404));
    }

    post.status = 'approved';
    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: 'Post approved successfully.',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a post
// @route   PATCH /admin/posts/reject/:id
// @access  Protected (Admin Only)
const rejectPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Post not found.', 404));
    }

    post.status = 'rejected';
    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: 'Post rejected successfully.',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingPosts,
  approvePost,
  rejectPost,
};

