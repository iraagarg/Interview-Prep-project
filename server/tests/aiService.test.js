require('./setup');
const {
  analyzeResume,
  generateFeedback,
  continueInterview,
  _internal: { parseJSON, missingScores, normalizeFeedback, clampScore, transcriptOf, hasSkill },
} = require('../services/aiService');

describe('parseJSON', () => {
  test('parses plain JSON', () => {
    expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
  });
  test('strips markdown code fences', () => {
    expect(parseJSON('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  test('extracts the object when the model adds prose around it', () => {
    expect(parseJSON('Sure! Here is the result: {"a":3} Hope this helps.')).toEqual({ a: 3 });
  });
  test('throws when there is no JSON at all', () => {
    expect(() => parseJSON('no json here')).toThrow();
  });
});

describe('normalisation of model output', () => {
  test('clampScore bounds and rounds values', () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore('72.6')).toBe(73);
    expect(clampScore('abc')).toBe(0);
  });

  test('normalizeFeedback enforces the schema', () => {
    const out = normalizeFeedback({
      overallScore: '88',
      communication: 120,
      technical: null,
      strengths: ['clear', '', 42, 'structured'],
      improvements: 'not an array',
      summary: 'ok',
    });
    expect(out.overallScore).toBe(88);
    expect(out.communication).toBe(100);
    expect(out.technical).toBe(0);
    expect(out.strengths).toEqual(['clear', 'structured']);
    expect(out.improvements).toEqual([]);
    expect(out.recommendations).toEqual([]);
  });

  test('missingScores rejects scores the model wrote as words or left empty', () => {
    const keys = ['overallScore', 'communication', 'technical'];
    expect(missingScores({ overallScore: 74, communication: '81', technical: 66.5 }, keys)).toEqual([]);
    expect(missingScores({ overallScore: 'thirty', communication: null, technical: '' }, keys))
      .toEqual(['overallScore', 'communication', 'technical']);
    expect(missingScores({}, ['overallScore'])).toEqual(['overallScore']);
  });
});

describe('transcript windowing', () => {
  test('keeps the most recent part of long transcripts', () => {
    const messages = [
      { role: 'assistant', content: 'FIRST question' },
      { role: 'user', content: 'x'.repeat(500) },
      { role: 'assistant', content: 'LAST question' },
    ];
    const t = transcriptOf(messages, 100);
    expect(t).toContain('LAST question');
    expect(t).not.toContain('FIRST question');
    expect(t).toContain('earlier part omitted');
  });

  test('hides system messages', () => {
    const t = transcriptOf([{ role: 'system', content: 'secret' }, { role: 'user', content: 'hi' }], 1000);
    expect(t).not.toContain('secret');
  });
});

describe('skill matching', () => {
  test('matches whole words only', () => {
    expect(hasSkill('i use go and react', 'Go')).toBe(true);
    expect(hasSkill('worked at google', 'Go')).toBe(false);
    expect(hasSkill('built with node.js', 'Node.js')).toBe(true);
    expect(hasSkill('c++ and java', 'C++')).toBe(true);
  });
});

describe('graceful degradation without an API key', () => {
  test('resume analysis falls back and is labelled', async () => {
    const out = await analyzeResume('Skills: React, Node.js, MongoDB, Docker. Projects: built a REST API. Education: B.Tech');
    expect(out.source).toBe('fallback');
    expect(out.skills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB', 'Docker']));
    expect(out.overallScore).toBeGreaterThan(0);
    expect(out.overallScore).toBeLessThanOrEqual(100);
  });

  test('interview keeps going with scripted questions', async () => {
    const reply = await continueInterview([{ role: 'assistant', content: 'Q1' }, { role: 'user', content: 'A1' }], 'SDE', 'technical');
    expect(reply).toMatch(/\?$/);
  });

  test('feedback falls back to a valid, labelled object', async () => {
    const fb = await generateFeedback([{ role: 'assistant', content: 'Q' }, { role: 'user', content: 'A detailed answer '.repeat(20) }], 'SDE', 'mixed');
    expect(fb.source).toBe('fallback');
    for (const k of ['overallScore', 'communication', 'technical', 'problemSolving', 'confidence']) {
      expect(Number.isInteger(fb[k])).toBe(true);
    }
  });
});
