const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('videos.db');

db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY,
    filename TEXT,
    size INTEGER,
    duration REAL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY,
    videoId INTEGER,
    token TEXT,
    expiryDate DATETIME,
    FOREIGN KEY (videoId) REFERENCES videos(id)
  )
`);

async function saveVideo(videoData) {
  return new Promise((resolve, reject) => {
    const { filename, size, duration } = videoData;
    db.run(`INSERT INTO videos (filename, size, duration) VALUES (?, ?, ?)`, [filename, size, duration], function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
}

async function getVideoById(videoId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM videos WHERE id = ?', [videoId], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

async function getFilenamesByIds(videoIds) {
  return new Promise((resolve, reject) => {
    db.all('SELECT filename FROM videos WHERE id IN (' + videoIds.join(',') + ')', (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows.map(row => row.filename));
    });
  });
}

async function createShareToken(videoId, expiryTime) {
  return new Promise((resolve, reject) => {
    const token = crypto.randomBytes(16).toString('hex');
    const expiryDate = new Date(Date.now() + expiryTime * 1000);

    db.run(`INSERT INTO shares (videoId, token, expiryDate) VALUES (?, ?, ?)`, [videoId, token, expiryDate], function (err) {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}

async function getVideoByShareToken(token) {
  return new Promise((resolve, reject) => {
    db.get('SELECT videoId FROM shares WHERE token = ? AND expiryDate > ?', [token], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return resolve(null);
      }
      resolve(getVideoById(row.videoId));
    });
  });
}

module.exports = {
  saveVideo,
  getVideoById,
  getFilenamesByIds,
  createShareToken,
  getVideoByShareToken
};
