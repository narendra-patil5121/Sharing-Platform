const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Suite A: Authentication (/auth)', () => {
  describe('POST /auth/register', () => {
    it('successfully registers a new user with hashed password and returns 201 status', async () => {
      const userData = {
        name: 'Naruto Uzumaki',
        email: 'naruto@konoha.com',
        password: 'password123',
        role: 'user',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');

      // Verify user is in database and password was hashed
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeDefined();
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('fails to register an existing email and returns 400 status', async () => {
      await User.create({
        name: 'Sasuke Uchiha',
        email: 'sasuke@konoha.com',
        password: 'password123',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Sasuke Duplicate',
          email: 'sasuke@konoha.com',
          password: 'anotherpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/already registered|already exists|duplicate/i);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Kakashi Hatake',
        email: 'kakashi@konoha.com',
        password: 'sharingan123',
        role: 'user',
      });
    });

    it('validates credentials and returns a valid JWT token with 200 status', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'kakashi@konoha.com',
          password: 'sharingan123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('fails on incorrect password/email with 401 status', async () => {
      // Wrong password
      const wrongPasswordResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'kakashi@konoha.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(wrongPasswordResponse.body).toHaveProperty('success', false);
      expect(wrongPasswordResponse.body.message).toMatch(/invalid credentials|incorrect/i);

      // Non-existent email
      const wrongEmailResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@konoha.com',
          password: 'sharingan123',
        })
        .expect(401);

      expect(wrongEmailResponse.body).toHaveProperty('success', false);
    });
  });

  describe('GET /auth/me (Protected route)', () => {
    let token;
    let createdUser;

    beforeEach(async () => {
      createdUser = await User.create({
        name: 'Itachi Uchiha',
        email: 'itachi@akatsuki.org',
        password: 'tsukuyomi123',
        role: 'admin',
      });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'itachi@akatsuki.org',
          password: 'tsukuyomi123',
        });

      token = loginRes.body.token;
    });

    it('decodes valid JWT token and returns logged-in user profile details (excluding password) with 200 status', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('_id', createdUser._id.toString());
      expect(response.body.user).toHaveProperty('name', 'Itachi Uchiha');
      expect(response.body.user).toHaveProperty('email', 'itachi@akatsuki.org');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('blocks unauthorized access without a token or invalid token with 401 status', async () => {
      // Without token
      const noTokenRes = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(noTokenRes.body).toHaveProperty('success', false);

      // With invalid token
      const invalidTokenRes = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token_12345')
        .expect(401);

      expect(invalidTokenRes.body).toHaveProperty('success', false);
    });
  });
});

