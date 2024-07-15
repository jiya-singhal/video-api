const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../utils/authMiddleware');
const videoController = require('../controllers/videoController');

const UPLOAD_FOLDER = 'uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Define routes and methods
router.post('/upload', authenticateToken, upload.single('video'), videoController.uploadVideo);
router.post('/trim/:id', authenticateToken, videoController.trimUploadedVideo);
router.post('/merge', authenticateToken, videoController.mergeUploadedVideos);
router.post('/share/:id', authenticateToken, videoController.generateShareableLink);

module.exports = router;
