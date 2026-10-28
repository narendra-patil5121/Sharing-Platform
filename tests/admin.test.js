const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

describe('Suite C: Admin Management (/admin/posts)', () => {
  let adminUser, normalUser;
  let adminToken, userToken;
  let pendingPost, draftPost;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Madara Uchiha',
      email: 'madara@akatsuki.org',
      password: 'password123',
      role: 'admin',
    });

    normalUser = await User.create({
      name: 'Deidara',
      email: 'deidara@akatsuki.org',
      password: 'password123',
      role: 'user',
    });

    const adminLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'madara@akatsuki.org', password: 'password123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'deidara@akatsuki.org', password: 'password123' });
    userToken = userLogin.body.token;

    pendingPost = await Post.create({
      title: 'Art is an Explosion',
      description: 'Clay sculptures guide',
      content: 'Detailed explosive clay formulations and techniques.',
      category: 'Art',
      createdBy: normalUser._id,
      status: 'pending',
    });

    draftPost = await Post.create({
      title: 'Draft in Progress',
      description: 'Not submitted yet',
      content: 'Unfinished art techniques',
      category: 'Art',
      createdBy: normalUser._id,
      status: 'draft',
    });
  });

  describe('GET /admin/posts/pending (Protected: Admin Only)', () => {
    it('returns all posts where status: "pending"', async () => {
      const response = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBeGreaterThanOrEqual(1);

      const allPending = response.body.posts.every(p => p.status === 'pending');
      expect(allPending).toBe(true);
      expect(response.body.posts[0]).toHaveProperty('_id', pendingPost._id.toString());
    });

    it('returns 403 Forbidden if requested by a normal "user"', async () => {
      const response = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/forbidden|permission|access denied|admin/i);
    });

    it('returns 401 Unauthorized if requested without authentication', async () => {
      await request(app)
        .get('/admin/posts/pending')
        .expect(401);
    });
  });

  describe('PATCH /admin/posts/approve/:id (Protected: Admin Only)', () => {
    it('changes target post status to "approved"', async () => {
      const response = await request(app)
        .patch(`/admin/posts/approve/${pendingPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('_id', pendingPost._id.toString());
      expect(response.body.post).toHaveProperty('status', 'approved');

      const updated = await Post.findById(pendingPost._id);
      expect(updated.status).toBe('approved');
    });

    it('returns 403 Forbidden if normal user attempts approval', async () => {
      const response = await request(app)
        .patch(`/admin/posts/approve/${pendingPost._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('returns 404 if post does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .patch(`/admin/posts/approve/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /admin/posts/reject/:id (Protected: Admin Only)', () => {
    it('changes target post status to "rejected"', async () => {
      const response = await request(app)
        .patch(`/admin/posts/reject/${pendingPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('_id', pendingPost._id.toString());
      expect(response.body.post).toHaveProperty('status', 'rejected');

      const updated = await Post.findById(pendingPost._id);
      expect(updated.status).toBe('rejected');
    });

    it('returns 403 Forbidden if normal user attempts rejection', async () => {
      const response = await request(app)
        .patch(`/admin/posts/reject/${pendingPost._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('returns 404 if post does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .patch(`/admin/posts/reject/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

