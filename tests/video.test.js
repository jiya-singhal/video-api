const request = require('supertest');
const app = require('../src/app');

describe('Video API', () => {
  it('should upload a video', async () => {
    const response = await request(app)
      .post('/videos/upload')
      .set('Authorization', 'your_static_token_here')
      .attach('video', 'tests/sample.mp4'); // Ensure you have a sample.mp4 file in the tests folder
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Video uploaded successfully');
  });

  it('should trim a video', async () => {
    const uploadResponse = await request(app)
      .post('/videos/upload')
      .set('Authorization', 'your_static_token_here')
      .attach('video', 'tests/sample.mp4');
    
    const videoId = uploadResponse.body.id;
    const response = await request(app)
      .post(`/videos/trim/${videoId}`)
      .set('Authorization', 'your_static_token_here')
      .send({ startTime: 0, endTime: 10 });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Video trimmed successfully');
  });

  it('should merge videos', async () => {
    const uploadResponse1 = await request(app)
      .post('/videos/upload')
      .set('Authorization', 'your_static_token_here')
      .attach('video', 'tests/sample1.mp4');

    const uploadResponse2 = await request(app)
      .post('/videos/upload')
      .set('Authorization', 'your_static_token_here')
      .attach('video', 'tests/sample2.mp4');
    
    const videoIds = [uploadResponse1.body.id, uploadResponse2.body.id];
    const response = await request(app)
      .post('/videos/merge')
      .set('Authorization', 'your_static_token_here')
      .send({ ids: videoIds });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Videos merged successfully');
  });

  it('should generate a shareable link', async () => {
    const uploadResponse = await request(app)
      .post('/videos/upload')
      .set('Authorization', 'your_static_token_here')
      .attach('video', 'tests/sample.mp4');

    const videoId = uploadResponse.body.id;
    const response = await request(app)
      .post(`/videos/share/${videoId}`)
      .set('Authorization', 'your_static_token_here')
      .send({ expiryTime: 60 }); // 1 minute
    expect(response.status).toBe(200);
    expect(response.body.link).toBeTruthy();
    expect(response.body.expiryDate).toBeTruthy();
  });
});
