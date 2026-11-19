const path = require('path');
const { connect, disconnect } = require('./setup');
const request = require('supertest');
const app = require('../app');

const PDF = path.join(__dirname, 'fixtures', 'sample-resume.pdf');

let tokenA;
let tokenB;
let interviewId;
let resumeId;

const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(connect);
afterAll(disconnect);

describe('health', () => {
  test('GET /api/health reports status and database state', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.db).toBe('connected');
  });

  test('unknown routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('authentication', () => {
  test('registers a user without leaking the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123', targetRole: 'Backend Developer' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.email).toBe('asha@example.com');
    tokenA = res.body.token;
  });

  test('rejects duplicate email (case-insensitive)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'ASHA@example.com', password: 'secret123' });
    expect(res.status).toBe(400);
  });

  test('rejects missing fields and short passwords', async () => {
    expect((await request(app).post('/api/auth/register').send({ email: 'x@y.z' })).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ name: 'x', email: 'x@y.z', password: '123' })).status).toBe(400);
  });

  test('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });

  test('login: wrong password -> 401, correct -> 200 (email is case-insensitive)', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'asha@example.com', password: 'nope' })).status).toBe(401);
    const ok = await request(app).post('/api/auth/login').send({ email: 'ASHA@example.com', password: 'secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });

  test('protected routes need a valid token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth('a.b.c'))).status).toBe(401);
    const me = await request(app).get('/api/auth/me').set(auth(tokenA));
    expect(me.status).toBe(200);
    expect(me.body.user.name).toBe('Asha');
  });

  test('profile update only changes provided fields', async () => {
    const res = await request(app).put('/api/auth/profile').set(auth(tokenA)).send({ skills: ['Node.js'] });
    expect(res.status).toBe(200);
    expect(res.body.user.skills).toEqual(['Node.js']);
    expect(res.body.user.name).toBe('Asha');
  });

  test('password change requires the current password', async () => {
    const bad = await request(app).put('/api/auth/password').set(auth(tokenA)).send({ currentPassword: 'wrong', newPassword: 'newpass1' });
    expect(bad.status).toBe(400);
  });

  test('second user for isolation tests', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ravi', email: 'ravi@example.com', password: 'secret123' });
    tokenB = res.body.token;
    expect(tokenB).toBeTruthy();
  });
});

describe('resume upload', () => {
  test('rejects non-PDF files with 400', async () => {
    const res = await request(app)
      .post('/api/resume/upload')
      .set(auth(tokenA))
      .attach('resume', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  test('rejects a file that claims to be a PDF but is not', async () => {
    const res = await request(app)
      .post('/api/resume/upload')
      .set(auth(tokenA))
      .attach('resume', Buffer.from('not really a pdf'), { filename: 'fake.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  test('accepts a text PDF and returns a structured analysis', async () => {
    const res = await request(app).post('/api/resume/upload').set(auth(tokenA)).attach('resume', PDF);
    expect(res.status).toBe(201);
    expect(res.body.resume.isAnalyzed).toBe(true);
    expect(res.body.resume.analysis.skills).toEqual(expect.arrayContaining(['React', 'MongoDB']));
    resumeId = res.body.resume._id;
  });

  test('another user cannot delete or re-analyse it', async () => {
    expect((await request(app).delete(`/api/resume/${resumeId}`).set(auth(tokenB))).status).toBe(404);
    expect((await request(app).post(`/api/resume/${resumeId}/analyze`).set(auth(tokenB))).status).toBe(404);
  });
});

describe('interview lifecycle', () => {
  test('validates type and difficulty', async () => {
    const res = await request(app).post('/api/interview').set(auth(tokenA)).send({ role: 'SDE', type: 'quiz' });
    expect(res.status).toBe(400);
  });

  test('cannot link another user\'s resume', async () => {
    const res = await request(app).post('/api/interview').set(auth(tokenB)).send({ role: 'SDE', resumeId });
    expect(res.status).toBe(404);
  });

  test('creates a session linked to own resume', async () => {
    const res = await request(app)
      .post('/api/interview')
      .set(auth(tokenA))
      .send({ role: 'Backend Developer', type: 'technical', difficulty: 'hard', resumeId });
    expect(res.status).toBe(201);
    expect(res.body.interview.status).toBe('active');
    interviewId = res.body.interview._id;
  });

  test('cannot end before answering', async () => {
    expect((await request(app).post(`/api/chat/end/${interviewId}`).set(auth(tokenA))).status).toBe(400);
  });

  test('start is idempotent (no duplicate opening question)', async () => {
    const a = await request(app).post(`/api/chat/start/${interviewId}`).set(auth(tokenA));
    const b = await request(app).post(`/api/chat/start/${interviewId}`).set(auth(tokenA));
    expect(a.status).toBe(200);
    expect(b.body.message).toBe(a.body.message);
    const msgs = await request(app).get(`/api/chat/messages/${interviewId}`).set(auth(tokenA));
    expect(msgs.body.messages).toHaveLength(1);
    expect(msgs.body.messages.some((m) => m.role === 'system')).toBe(false);
  });

  test('rejects empty and oversized answers', async () => {
    expect((await request(app).post(`/api/chat/message/${interviewId}`).set(auth(tokenA)).send({ message: '  ' })).status).toBe(400);
    expect((await request(app).post(`/api/chat/message/${interviewId}`).set(auth(tokenA)).send({ message: 'x'.repeat(4001) })).status).toBe(400);
  });

  test('answering produces a follow-up and counts questions', async () => {
    const res = await request(app)
      .post(`/api/chat/message/${interviewId}`)
      .set(auth(tokenA))
      .send({ message: 'I would add an index on the email field and cache hot reads in Redis.' });
    expect(res.status).toBe(200);
    expect(res.body.message.length).toBeGreaterThan(10);
    expect(res.body.questionsAsked).toBe(2);
  });

  test('another user cannot read or answer this interview', async () => {
    expect((await request(app).get(`/api/interview/${interviewId}`).set(auth(tokenB))).status).toBe(404);
    expect((await request(app).post(`/api/chat/message/${interviewId}`).set(auth(tokenB)).send({ message: 'hi' })).status).toBe(404);
  });

  test('invalid ids return 404, not 500', async () => {
    expect((await request(app).get('/api/interview/not-an-id').set(auth(tokenA))).status).toBe(404);
  });

  test('ending produces schema-valid feedback and updates user stats', async () => {
    const res = await request(app).post(`/api/chat/end/${interviewId}`).set(auth(tokenA));
    expect(res.status).toBe(200);
    const fb = res.body.feedback;
    for (const k of ['overallScore', 'communication', 'technical', 'problemSolving', 'confidence']) {
      expect(Number.isInteger(fb[k])).toBe(true);
      expect(fb[k]).toBeGreaterThanOrEqual(0);
      expect(fb[k]).toBeLessThanOrEqual(100);
    }
    const me = await request(app).get('/api/auth/me').set(auth(tokenA));
    expect(me.body.user.totalInterviews).toBe(1);
    expect(me.body.user.averageScore).toBe(fb.overallScore);
  });

  test('ending twice is idempotent and answering after the end is rejected', async () => {
    const again = await request(app).post(`/api/chat/end/${interviewId}`).set(auth(tokenA));
    expect(again.status).toBe(200);
    expect((await request(app).post(`/api/chat/message/${interviewId}`).set(auth(tokenA)).send({ message: 'more' })).status).toBe(400);
  });

  test('abandon only works on active sessions', async () => {
    expect((await request(app).put(`/api/interview/${interviewId}/abandon`).set(auth(tokenA))).status).toBe(400);
    const iv = await request(app).post('/api/interview').set(auth(tokenA)).send({ role: 'SDE' });
    const res = await request(app).put(`/api/interview/${iv.body.interview._id}/abandon`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.interview.status).toBe('abandoned');
  });
});

describe('history and analytics', () => {
  test('history is paginated and excludes transcripts', async () => {
    const res = await request(app).get('/api/interview?page=1&limit=1').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.interviews).toHaveLength(1);
    expect(res.body.pages).toBe(2);
    expect(res.body.interviews[0].messages).toBeUndefined();
  });

  test('analytics aggregate only the caller\'s completed sessions', async () => {
    const a = await request(app).get('/api/analytics/overview').set(auth(tokenA));
    expect(a.body.stats.completedInterviews).toBe(1);
    const b = await request(app).get('/api/analytics/overview').set(auth(tokenB));
    expect(b.body.stats.completedInterviews).toBe(0);
    const skills = await request(app).get('/api/analytics/skills').set(auth(tokenA));
    expect(skills.status).toBe(200);
    const prog = await request(app).get('/api/analytics/progress?days=9999').set(auth(tokenA));
    expect(prog.body.period).toBe('365 days');
  });

  test('deleting a completed interview recalculates stats', async () => {
    expect((await request(app).delete(`/api/interview/${interviewId}`).set(auth(tokenA))).status).toBe(200);
    const me = await request(app).get('/api/auth/me').set(auth(tokenA));
    expect(me.body.user.totalInterviews).toBe(0);
  });
});

describe('concurrent requests', () => {
  let id;
  test('simultaneous starts store exactly one opening question', async () => {
    const iv = await request(app).post('/api/interview').set(auth(tokenA)).send({ role: 'SDE' });
    id = iv.body.interview._id;
    const results = await Promise.all([1, 2, 3].map(() => request(app).post(`/api/chat/start/${id}`).set(auth(tokenA))));
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    const msgs = await request(app).get(`/api/chat/messages/${id}`).set(auth(tokenA));
    expect(msgs.body.messages.filter((m) => m.role === 'assistant')).toHaveLength(1);
  });

  test('simultaneous ends evaluate the session once and never return 500', async () => {
    await request(app).post(`/api/chat/message/${id}`).set(auth(tokenA)).send({ message: 'I built a REST API with Express and MongoDB.' });
    const results = await Promise.all([1, 2].map(() => request(app).post(`/api/chat/end/${id}`).set(auth(tokenA))));
    results.forEach((r) => expect([200, 409]).toContain(r.status));
    expect(results.some((r) => r.status === 200)).toBe(true);
    const iv = await request(app).get(`/api/interview/${id}`).set(auth(tokenA));
    expect(iv.body.interview.status).toBe('completed');
    expect((await request(app).post(`/api/chat/message/${id}`).set(auth(tokenA)).send({ message: 'late' })).status).toBe(400);
  });
});

describe('error mapping', () => {
  test('wrongly typed body fields are 400, not 404 or 500', async () => {
    const res = await request(app).put('/api/auth/profile').set(auth(tokenA)).send({ skills: [{ a: 1 }] });
    expect(res.status).toBe(400);
  });

  test('simultaneous registrations with one email: one 201, one 400/409, no 500', async () => {
    const body = { name: 'Ravi', email: 'race@example.com', password: 'secret123' };
    const results = await Promise.all([1, 2].map(() => request(app).post('/api/auth/register').send(body)));
    const codes = results.map((r) => r.status).sort();
    expect(codes[0]).toBe(201);
    expect([400, 409]).toContain(codes[1]);
  });
});

describe('input validation', () => {
  test('non-string passwords are rejected with 400, never 500', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'asha@example.com', password: 123456 })).status).toBe(400);
    expect((await request(app).post('/api/auth/login').send({ email: 'asha@example.com', password: {} })).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ name: 'X', email: 'x@example.com', password: ['secret123'] })).status).toBe(400);
  });

  test('profile fields are bounded', async () => {
    expect((await request(app).put('/api/auth/profile').set(auth(tokenA)).send({ targetRole: 'x'.repeat(81) })).status).toBe(400);
    expect((await request(app).put('/api/auth/profile').set(auth(tokenA)).send({ skills: Array.from({ length: 31 }, (_, i) => `s${i}`) })).status).toBe(400);
    expect((await request(app).put('/api/auth/profile').set(auth(tokenA)).send({ skills: ['x'.repeat(41)] })).status).toBe(400);
  });

  test('a blank role falls back to the profile target role', async () => {
    const res = await request(app).post('/api/interview').set(auth(tokenA)).send({ role: '   ' });
    expect(res.status).toBe(201);
    expect(res.body.interview.role).toBe('Backend Developer');
  });
});

describe('password change', () => {
  test('tokens issued before a password change stop working; the new token works', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'Meera', email: 'meera@example.com', password: 'secret123' });
    const oldToken = reg.body.token;
    await new Promise((r) => setTimeout(r, 1500)); // JWT iat has 1-second resolution
    const res = await request(app).put('/api/auth/password').set(auth(oldToken)).send({ currentPassword: 'secret123', newPassword: 'secret456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect((await request(app).get('/api/auth/me').set(auth(oldToken))).status).toBe(401);
    const me = await request(app).get('/api/auth/me').set(auth(res.body.token));
    expect(me.status).toBe(200);
    expect(me.body.user.passwordChangedAt).toBeUndefined();
  });
});
