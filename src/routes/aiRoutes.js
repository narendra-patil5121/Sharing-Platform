const express = require('express');
const { improvePost } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/improve/:postId', protect, improvePost);

module.exports = router;

