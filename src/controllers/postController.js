const Post = require('../models/Post');
const { AppError } = require('../middlewares/errorHandler');

// @desc    Create a new post or draft
// @route   POST /posts
// @access  Protected (User/Admin)
const createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    const post = await Post.create({
      title,
      description,
      content,
      image: image || '',
      category,
      status: status || 'draft',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved posts
// @route   GET /posts
// @access  Public
const getApprovedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'approved' })
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

// @desc    Get an approved post by ID
// @route   GET /posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      status: 'approved',
    }).populate('createdBy', 'name email role');

    if (!post) {
      return next(new AppError('Approved post not found.', 404));
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts and drafts belonging to current user
// @route   GET /posts/my-posts
// @access  Protected (User/Admin)
const getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PATCH /posts/:id
// @access  Protected (Owner Only)
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Post not found.', 404));
    }

    // Check ownership
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You are not authorized to modify this post.', 403)
      );
    }

    const allowedUpdates = [
      'title',
      'description',
      'content',
      'image',
      'category',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /posts/:id
// @access  Protected (Owner Only)
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError('Post not found.', 404));
    }

    // Check ownership
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You are not authorized to delete this post.', 403)
      );
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
};

