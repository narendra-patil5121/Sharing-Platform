const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

describe('Suite B: User Post Management (/posts)', () => {
  let user1, user2;
  let token1, token2;

  beforeEach(async () => {
    user1 = await User.create({
      name: 'Pain',
      email: 'pain@akatsuki.org',
      password: 'password123',
      role: 'user',
    });

    user2 = await User.create({
      name: 'Konan',
      email: 'konan@akatsuki.org',
      password: 'password123',
      role: 'user',
    });

    const loginRes1 = await request(app)
      .post('/auth/login')
      .send({ email: 'pain@akatsuki.org', password: 'password123' });
    token1 = loginRes1.body.token;

    const loginRes2 = await request(app)
      .post('/auth/login')
      .send({ email: 'konan@akatsuki.org', password: 'password123' });
    token2 = loginRes2.body.token;
  });

  describe('POST /posts (Protected: User/Admin)', () => {
    it('creates a new post or draft with status "draft" and returns 201 status', async () => {
      const postData = {
        title: 'Project Tsukuyomi Overview',
        description: 'A detailed breakdown of the plan for global peace.',
        content: 'Long form comprehensive article text describing steps and strategies.',
        category: 'Strategy',
        image: 'https://example.com/cover.jpg',
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('_id');
      expect(response.body.post).toHaveProperty('title', postData.title);
      expect(response.body.post).toHaveProperty('status', 'draft');
      expect(response.body.post).toHaveProperty('createdBy', user1._id.toString());

      // Check DB
      const dbPost = await Post.findById(response.body.post._id);
      expect(dbPost).toBeDefined();
      expect(dbPost.status).toBe('draft');
    });

    it('returns 401 when creating post without authentication', async () => {
      await request(app)
        .post('/posts')
        .send({
          title: 'Unauthenticated Post',
          description: 'Desc',
          content: 'Content',
          category: 'General',
        })
        .expect(401);
    });
  });

  describe('GET /posts (Public)', () => {
    beforeEach(async () => {
      await Post.create([
        {
          title: 'Approved Post 1',
          description: 'Approved Desc 1',
          content: 'Approved Content 1',
          category: 'News',
          createdBy: user1._id,
          status: 'approved',
        },
        {
          title: 'Approved Post 2',
          description: 'Approved Desc 2',
          content: 'Approved Content 2',
          category: 'News',
          createdBy: user2._id,
          status: 'approved',
        },
        {
          title: 'Draft Post',
          description: 'Draft Desc',
          content: 'Draft Content',
          category: 'Tech',
          createdBy: user1._id,
          status: 'draft',
        },
        {
          title: 'Pending Post',
          description: 'Pending Desc',
          content: 'Pending Content',
          category: 'Tech',
          createdBy: user2._id,
          status: 'pending',
        },
        {
          title: 'Rejected Post',
          description: 'Rejected Desc',
          content: 'Rejected Content',
          category: 'Tech',
          createdBy: user1._id,
          status: 'rejected',
        },
      ]);
    });

    it('returns only posts where status: "approved" with 200 status', async () => {
      const response = await request(app)
        .get('/posts')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts).toHaveLength(2);

      const allApproved = response.body.posts.every(p => p.status === 'approved');
      expect(allApproved).toBe(true);
    });
  });

  describe('GET /posts/:id (Public)', () => {
    let approvedPost, draftPost;

    beforeEach(async () => {
      approvedPost = await Post.create({
        title: 'Public Knowledge',
        description: 'Approved post for everyone',
        content: 'Content for the masses',
        category: 'Public',
        createdBy: user1._id,
        status: 'approved',
      });

      draftPost = await Post.create({
        title: 'Secret Draft',
        description: 'Not approved post',
        content: 'Private content',
        category: 'Secret',
        createdBy: user1._id,
        status: 'draft',
      });
    });

    it('returns the approved post matching the given ID', async () => {
      const response = await request(app)
        .get(`/posts/${approvedPost._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('_id', approvedPost._id.toString());
      expect(response.body.post).toHaveProperty('title', 'Public Knowledge');
    });

    it('returns 404 if not found or not approved', async () => {
      // Draft post should return 404 on public route
      const draftRes = await request(app)
        .get(`/posts/${draftPost._id}`)
        .expect(404);
      expect(draftRes.body).toHaveProperty('success', false);

      // Non-existent ID should return 404
      const nonExistentId = '507f1f77bcf86cd799439011';
      const notFoundRes = await request(app)
        .get(`/posts/${nonExistentId}`)
        .expect(404);
      expect(notFoundRes.body).toHaveProperty('success', false);
    });
  });

  describe('GET /posts/my-posts (Protected: User/Admin)', () => {
    beforeEach(async () => {
      await Post.create([
        {
          title: 'User 1 Draft',
          description: 'Desc',
          content: 'Content',
          category: 'Tech',
          createdBy: user1._id,
          status: 'draft',
        },
        {
          title: 'User 1 Approved',
          description: 'Desc',
          content: 'Content',
          category: 'Tech',
          createdBy: user1._id,
          status: 'approved',
        },
        {
          title: 'User 2 Pending',
          description: 'Desc',
          content: 'Content',
          category: 'Tech',
          createdBy: user2._id,
          status: 'pending',
        },
      ]);
    });

    it('returns all posts and drafts belonging exclusively to the authenticated user', async () => {
      const response = await request(app)
        .get('/posts/my-posts')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts).toHaveLength(2);

      const allBelongToUser1 = response.body.posts.every(
        p => p.createdBy._id?.toString() === user1._id.toString() || p.createdBy.toString() === user1._id.toString()
      );
      expect(allBelongToUser1).toBe(true);
    });
  });

  describe('PATCH /posts/:id (Protected: Post Owner Only)', () => {
    let user1Post;

    beforeEach(async () => {
      user1Post = await Post.create({
        title: 'Original Title',
        description: 'Original Description',
        content: 'Original Content',
        category: 'Initial',
        createdBy: user1._id,
        status: 'draft',
      });
    });

    it('updates allowed post fields and returns 200 status', async () => {
      const response = await request(app)
        .patch(`/posts/${user1Post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('title', 'Updated Title');
      expect(response.body.post).toHaveProperty('description', 'Updated Description');
      expect(response.body.post).toHaveProperty('content', 'Original Content');
    });

    it('returns 403 Forbidden if a user tries to modify someone else\'s post', async () => {
      const response = await request(app)
        .patch(`/posts/${user1Post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Malicious Update',
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/not authorized|forbidden|owner/i);
    });
  });

  describe('DELETE /posts/:id (Protected: Post Owner Only)', () => {
    let user1Post;

    beforeEach(async () => {
      user1Post = await Post.create({
        title: 'To Be Deleted',
        description: 'Delete me',
        content: 'Content',
        category: 'Temp',
        createdBy: user1._id,
        status: 'draft',
      });
    });

    it('successfully deletes the post and returns 200/204 status', async () => {
      const response = await request(app)
        .delete(`/posts/${user1Post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(res => {
          if (res.status !== 200 && res.status !== 204) {
            throw new Error(`Expected 200 or 204, got ${res.status}`);
          }
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      }

      const deleted = await Post.findById(user1Post._id);
      expect(deleted).toBeNull();
    });

    it('returns 403 Forbidden if a user tries to delete someone else\'s post', async () => {
      const response = await request(app)
        .delete(`/posts/${user1Post._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/not authorized|forbidden|owner/i);

      // Verify post still exists in DB
      const postStillExists = await Post.findById(user1Post._id);
      expect(postStillExists).not.toBeNull();
    });
  });
});

