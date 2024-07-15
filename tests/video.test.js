const request = require('supertest');
const app = require('../src/app');

describe('Video API', () => {
  const authToken = process.env.TEST_AUTH_TOKEN;// Replace with actual token if needed

  it('should upload a video', async () => {
    const response = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/carVideo.mp4'); 

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Video uploaded successfully');
    expect(response.body.id).toBeTruthy(); // Ensure an ID is returned
  });

  it('should fail to upload an invalid video', async () => {
    const response = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/invalid.txt'); // Uploading a non-MP4 file

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Only .mp4 files are allowed');
  });

  it('should trim a video', async () => {
    const uploadResponse = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/sample.mp4');

    const videoId = uploadResponse.body.id;
    const response = await request(app)
      .post(`/videos/trim/${videoId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ startTime: '00:00:00', endTime: '00:00:10' }); // Use proper time format
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Video trimmed successfully');
  });

  it('should fail to trim a non-existent video', async () => {
    const response = await request(app)
      .post('/videos/trim/9999') // Using a non-existent video ID
      .set('Authorization', `Bearer ${authToken}`)
      .send({ startTime: '00:00:00', endTime: '00:00:10' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Video not found');
  });

  it('should merge videos', async () => {
    const uploadResponse1 = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/sample1.mp4');

    const uploadResponse2 = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/sample2.mp4');

    const videoIds = [uploadResponse1.body.id, uploadResponse2.body.id];
    const response = await request(app)
      .post('/videos/merge')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ids: videoIds });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Videos merged successfully');
  });

  it('should fail to merge videos with missing IDs', async () => {
    const response = await request(app)
      .post('/videos/merge')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ids: [] }); // No video IDs provided

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('One or more videos not found');
  });

  it('should generate a shareable link', async () => {
    const uploadResponse = await request(app)
      .post('/videos/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('video', 'tests/sample.mp4');

    const videoId = uploadResponse.body.id;
    const response = await request(app)
      .post(`/videos/share/${videoId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ expiryTime: 60 }); // 1 minute

    expect(response.status).toBe(200);
    expect(response.body.link).toBeTruthy();
    expect(response.body.expiryDate).toBeTruthy();
  });

  it('should fail to generate a shareable link for a non-existent video', async () => {
    const response = await request(app)
      .post('/videos/share/9999') // Using a non-existent video ID
      .set('Authorization', `Bearer ${authToken}`)
      .send({ expiryTime: 60 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Video not found');
  });
});
