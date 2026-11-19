const { connect, disconnect } = require('./setup');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Interview = require('../models/Interview');

beforeAll(connect);
afterAll(disconnect);

const auth = (t) => ({ Authorization: `Bearer ${t}` });

test('overview covers every completed session and excludes fallback scores from averages', async () => {
  const reg = await request(app).post('/api/auth/register').send({ name: 'Kiran', email: 'kiran@example.com', password: 'secret123' });
  const token = reg.body.token;
  const user = new mongoose.Types.ObjectId(reg.body.user._id);
  const base = { user, status: 'completed', role: 'SDE', type: 'technical', duration: 10 };
  const docs = Array.from({ length: 12 }, (_, i) => ({
    ...base,
    feedback: { overallScore: 80, communication: 70, technical: 60, problemSolving: 50, confidence: 90, source: 'ai', strengths: [`point ${i}`] },
  }));
  docs.push({ ...base, feedback: { overallScore: 45, source: 'fallback', strengths: ['Completed the full interview session'] } });
  await Interview.insertMany(docs);

  const res = await request(app).get('/api/analytics/overview').set(auth(token));
  expect(res.status).toBe(200);
  const s = res.body.stats;
  expect(s.completedInterviews).toBe(13);
  expect(s.scoredInterviews).toBe(12);
  expect(s.totalDuration).toBe(130); // all 13 sessions, not just the latest 10
  expect(s.averageScores).toEqual({ overall: 80, communication: 70, technical: 60, problemSolving: 50, confidence: 90 });
  expect(s.scoreTrend).toHaveLength(10);

  const skills = await request(app).get('/api/analytics/skills').set(auth(token));
  expect(skills.body.analytics.recentStrengths.map((x) => x.text)).not.toContain('Completed the full interview session');
  expect(skills.body.analytics.recentStrengths.length).toBeLessThanOrEqual(5);
});
