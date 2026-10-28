const express = require('express');
const {
  getPendingPosts,
  approvePost,
  rejectPost,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// Apply protect & restrictTo('admin') to all admin post routes
router.use(protect, restrictTo('admin'));

router.get('/pending', getPendingPosts);
router.patch('/approve/:id', approvePost);
router.patch('/reject/:id', rejectPost);

module.exports = router;

