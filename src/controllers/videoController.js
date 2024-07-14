const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/videoModel');
const { generateUniqueFilename, trimVideo, mergeVideos, getVideoDuration } = require('../utils/videoUtils');

const UPLOAD_FOLDER = 'uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.mp4') {
      return cb(new Error('Only .mp4 files are allowed'));
    }
    cb(null, true);
  }
}).single('video');

const uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const videoPath = req.file.path;
    try {
      const duration = await getVideoDuration(videoPath);
      if (duration < 5 || duration > 25) {
        fs.unlinkSync(videoPath);
        return res.status(400).json({ error: 'Invalid video duration' });
      }

      db.run('INSERT INTO videos (path, size, duration) VALUES (?, ?, ?)', [videoPath, req.file.size, duration], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Video uploaded successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Error processing video' });
    }
  });const jwt = require('jsonwebtoken');

  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
  
  module.exports = authenticateToken;
  
};

const trimUploadedVideo = (req, res) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;

  db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const outputPath = `./uploads/${generateUniqueFilename()}`;
    trimVideo(row.path, startTime, endTime, outputPath, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Trimming error' });
      }

      db.run('INSERT INTO videos (path, size, duration) VALUES (?, ?, ?)', [outputPath, row.size, row.duration], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Video trimmed successfully' });
      });
    });
  });
};

const mergeUploadedVideos = (req, res) => {
  const { ids } = req.body;

  db.all(`SELECT * FROM videos WHERE id IN (${ids.map(() => '?').join(',')})`, ids, (err, rows) => {
    if (err || rows.length !== ids.length) {
      return res.status(404).json({ error: 'One or more videos not found' });
    }

    const inputPaths = rows.map(row => row.path);
    const outputPath = `./uploads/${generateUniqueFilename()}`;
    mergeVideos(inputPaths, outputPath, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Merging error' });
      }

      const totalSize = rows.reduce((acc, row) => acc + row.size, 0);
      const totalDuration = rows.reduce((acc, row) => acc + row.duration, 0);
      db.run('INSERT INTO videos (path, size, duration) VALUES (?, ?, ?)', [outputPath, totalSize, totalDuration], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Videos merged successfully' });
      });
    });
  });
};

const generateShareableLink = (req, res) => {
  const { id } = req.params;
  const { expiryTime } = req.body; // Assume expiryTime in seconds

  db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const expiryDate = new Date(Date.now() + expiryTime * 1000);
    db.run('UPDATE videos SET expiry = ? WHERE id = ?', [expiryDate, id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const link = `http://localhost:3000/videos/${id}`;
      res.status(200).json({ link, expiryDate });
    });
  });
};

const getSharedVideo = (req, res) => {
  const { token } = req.params;

  db.get('SELECT * FROM videos WHERE expiry IS NOT NULL AND id = ?', [token], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Video not found or expired' });
    }
    res.status(200).json({ path: row.path, expiryDate: row.expiry });
  });
};

module.exports = { uploadVideo, trimUploadedVideo, mergeUploadedVideos, generateShareableLink, getSharedVideo };
