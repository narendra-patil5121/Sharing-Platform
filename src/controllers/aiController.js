const Post = require('../models/Post');
const { improveContent } = require('../services/geminiService');
const { AppError } = require('../middlewares/errorHandler');

// @desc    Improve post content using Google Gemini AI and save as a new draft
// @route   POST /ai/improve/:postId
// @access  Protected (Owner Only)
const improvePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return next(new AppError('Post not found.', 404));
    }

    // Ensure the requester is the post owner
    if (originalPost.createdBy.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You can only improve your own posts.', 403)
      );
    }

    // Generate improved content using Google Gemini API
    const improvedContent = await improveContent(originalPost.content, {
      title: originalPost.title,
      category: originalPost.category,
    });

    // Save as brand new draft with unique ID, retaining user ownership and original post
    const newDraft = await Post.create({
      title: (req.body && req.body.title) || originalPost.title,
      description: (req.body && req.body.description) || originalPost.description,
      content: improvedContent,
      image: originalPost.image,
      category: originalPost.category,
      createdBy: req.user._id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: 'Post successfully enhanced and saved as a new draft.',
      post: newDraft,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  improvePost,
};

