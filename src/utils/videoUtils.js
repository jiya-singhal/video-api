const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');

function generateUniqueFilename() {
  return crypto.randomBytes(16).toString('hex');
}

function trimVideo(inputPath, startTime, endTime, outputPath, callback) {
  const command = `ffmpeg -i ${inputPath} -ss ${startTime} -to ${endTime} -c copy ${outputPath}`;
  exec(command, callback);
}

function mergeVideos(inputPaths, outputPath, callback) {
  const fileListPath = path.join(__dirname, 'fileList.txt');
  const fileListContent = inputPaths.map(p => `file '${p}'`).join('\n');
  require('fs').writeFileSync(fileListPath, fileListContent);

  const command = `ffmpeg -f concat -safe 0 -i ${fileListPath} -c copy ${outputPath}`;
  exec(command, (err) => {
    require('fs').unlinkSync(fileListPath);
    callback(err);
  });
}

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -i ${videoPath} -show_entries format=duration -v quiet -of csv="p=0"`;
    exec(command, (err, stdout) => {
      if (err) return reject(err);
      resolve(parseFloat(stdout));
    });
  });
}

module.exports = { generateUniqueFilename, trimVideo, mergeVideos, getVideoDuration };
