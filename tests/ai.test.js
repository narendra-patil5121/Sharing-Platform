const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

describe('Suite D: AI Integration (/ai)', () => {
  let user1, user2;
  let token1, token2;
  let originalPost;

  beforeEach(async () => {
    mockGenerateContent.mockReset();

    user1 = await User.create({
      name: 'Sasori',
      email: 'sasori@akatsuki.org',
      password: 'puppetmaster123',
      role: 'user',
    });

    user2 = await User.create({
      name: 'Kisame',
      email: 'kisame@akatsuki.org',
      password: 'samehada123',
      role: 'user',
    });

    const loginRes1 = await request(app)
      .post('/auth/login')
      .send({ email: 'sasori@akatsuki.org', password: 'puppetmaster123' });
    token1 = loginRes1.body.token;

    const loginRes2 = await request(app)
      .post('/auth/login')
      .send({ email: 'kisame@akatsuki.org', password: 'samehada123' });
    token2 = loginRes2.body.token;

    originalPost = await Post.create({
      title: 'Puppet Master Techniques',
      description: 'Crafting the ultimate human puppet.',
      content: 'Rough draft containing basic puppet mechanics without refinement.',
      category: 'Puppetry',
      image: 'https://example.com/puppet.jpg',
      createdBy: user1._id,
      status: 'draft',
    });
  });

  describe('POST /ai/improve/:postId (Protected: Post Owner Only)', () => {
    it('fetches original post, sends content to Gemini API to improve it, saves enhanced version as brand new draft with new unique ID, sets createdBy to same user, leaves original post unmodified, and returns 201 status', async () => {
      const improvedContent = 'Enhanced and deeply refined masterwork detailing the supreme art of puppet crafting.';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => improvedContent,
        },
      });

      const response = await request(app)
        .post(`/ai/improve/${originalPost._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('post');
      const newDraft = response.body.post;

      // 1. Must have brand new unique ID
      expect(newDraft._id).toBeDefined();
      expect(newDraft._id.toString()).not.toBe(originalPost._id.toString());

      // 2. Must be status "draft"
      expect(newDraft.status).toBe('draft');

      // 3. Must have enhanced content
      expect(newDraft.content).toBe(improvedContent);

      // 4. Must set createdBy to the same user
      expect(newDraft.createdBy.toString()).toBe(user1._id.toString());

      // 5. Original post must remain unmodified in DB
      const postInDb = await Post.findById(originalPost._id);
      expect(postInDb.content).toBe('Rough draft containing basic puppet mechanics without refinement.');
      expect(postInDb.status).toBe('draft');

      // 6. Gemini mock should have been called with original content
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('returns 403 Forbidden if user tries to improve another user\'s post', async () => {
      const response = await request(app)
        .post(`/ai/improve/${originalPost._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/not authorized|forbidden|owner/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns 404 if target post does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/ai/improve/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns 401 if request is unauthenticated', async () => {
      await request(app)
        .post(`/ai/improve/${originalPost._id}`)
        .expect(401);

      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });
});

