/**
 * AI service: every call to the language model goes through this module.
 *
 * Design decisions
 * - Two models: a fast one for real-time interview turns (latency matters on every
 *   answer) and a stronger one for resume analysis and final scoring (quality matters,
 *   runs once per session). Both are configurable through env vars, so a provider
 *   retiring a model is a config change, not a code change.
 * - Structured output: prompts demand a fixed JSON shape; responses are parsed
 *   defensively and then normalised (scores clamped to 0-100 integers, arrays enforced).
 * - Graceful degradation: if the API key is missing, the provider is down, or the
 *   output is unusable, a deterministic rule-based fallback is returned instead of an
 *   error, and the result is tagged source: 'fallback'.
 */
const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'; // quality: analysis + feedback
const FAST_MODEL = process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b'; // speed: interview turns
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 25000;

let cachedClient;
const getClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.length < 10) return null;
  if (!cachedClient) cachedClient = new Groq({ apiKey: key, timeout: TIMEOUT_MS, maxRetries: 1 });
  return cachedClient;
};

const generate = async (prompt, { fast = false, maxTokens = 1024 } = {}) => {
  const client = getClient();
  if (!client) throw new Error('NO_API_KEY');
  const model = fast ? FAST_MODEL : MODEL;

  const params = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens,
  };
  // gpt-oss models are reasoning models: keep reasoning short so the answer fits the budget
  if (model.startsWith('openai/gpt-oss')) {
    params.reasoning_effort = 'low';
    params.max_tokens = maxTokens * 2;
  }

  const completion = await client.chat.completions.create(params);
  const text = completion.choices?.[0]?.message?.content?.trim() || '';
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
};

// ─── Output parsing & normalisation ─────────────────────────────────────────

const parseJSON = (text) => {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/); // outermost object
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
};

const clampScore = (v) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
};

const strList = (v, max = 8) =>
  (Array.isArray(v) ? v : [])
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => x.trim().slice(0, 300))
    .slice(0, max);

const normalizeFeedback = (raw) => ({
  overallScore: clampScore(raw.overallScore),
  communication: clampScore(raw.communication),
  technical: clampScore(raw.technical),
  problemSolving: clampScore(raw.problemSolving),
  confidence: clampScore(raw.confidence),
  strengths: strList(raw.strengths),
  improvements: strList(raw.improvements),
  summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 1200) : '',
  recommendations: strList(raw.recommendations),
});

const normalizeResumeAnalysis = (raw) => ({
  summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 1200) : '',
  skills: strList(raw.skills, 20),
  experience: strList(raw.experience),
  education: strList(raw.education),
  strengths: strList(raw.strengths),
  weaknesses: strList(raw.weaknesses),
  missingSkills: strList(raw.missingSkills),
  overallScore: clampScore(raw.overallScore),
  recommendations: strList(raw.recommendations),
});

// Keep the most recent part of long transcripts: the end of an interview carries
// the follow-ups that best show how the candidate handled pressure.
const transcriptOf = (messages, maxChars) => {
  const text = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n\n');
  return text.length > maxChars ? `[...earlier part omitted...]\n${text.slice(-maxChars)}` : text;
};

const logFallback = (where, err) => {
  if (err.message === 'NO_API_KEY') return;
  console.error(`AI fallback in ${where}:`, String(err.message).slice(0, 160));
};

// ─── Rule-based fallbacks ───────────────────────────────────────────────────

const SKILL_LIST = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust',
  'React', 'Angular', 'Vue', 'Next.js', 'Nuxt', 'Svelte',
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
  'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Redis', 'Firebase', 'DynamoDB', 'Cassandra',
  'HTML', 'CSS', 'SCSS', 'Sass', 'Tailwind CSS', 'Bootstrap', 'Material UI',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform',
  'REST API', 'GraphQL', 'WebSocket', 'gRPC', 'Microservices',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
  'Linux', 'Bash', 'Agile', 'Scrum', 'JIRA', 'Figma', 'Postman', 'Swagger',
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasSkill = (lower, skill) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(skill.toLowerCase())}($|[^a-z0-9])`).test(lower);

const fallbackResumeAnalysis = (text) => {
  const lower = text.toLowerCase();
  const found = SKILL_LIST.filter((s) => hasSkill(lower, s));

  let score = 30;
  score += Math.min(found.length * 3, 25);
  score += Math.min(Math.floor(text.length / 200), 15);
  if (/experience|worked|intern/.test(lower)) score += 5;
  if (/education|university|college|degree|b\.tech/.test(lower)) score += 5;
  if (/project|built|developed/.test(lower)) score += 7;
  if (/github|portfolio|linkedin/.test(lower)) score += 5;
  if (/award|achievement|certified|rank/.test(lower)) score += 5;
  score = Math.min(score, 92);

  const missing = ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'GraphQL', 'TypeScript']
    .filter((s) => !hasSkill(lower, s))
    .slice(0, 3);

  return {
    summary: `Keyword-based analysis (AI analysis was temporarily unavailable): ${found.length} recognised technical skills detected in a ${text.length > 1500 ? 'detailed' : 'concise'} resume.`,
    skills: found.length ? found.slice(0, 12) : ['Programming', 'Software Development'],
    experience: [],
    education: [],
    strengths: [
      found.length >= 5 ? 'Broad technical skill set' : 'Core technical skills present',
      lower.includes('project') ? 'Project experience demonstrated' : 'Clear and concise resume',
    ],
    weaknesses: ['Add quantified outcomes to each bullet (for example "reduced load time by 40%")'],
    missingSkills: missing,
    overallScore: score,
    recommendations: [
      'Add measurable impact metrics to each experience and project bullet',
      'Include links to GitHub and live demos for your projects',
      'Re-run the analysis later for detailed AI feedback',
    ],
  };
};

const QUESTIONS = {
  technical: [
    "Welcome to your technical interview. To start, could you walk me through your technical background and the project you are most proud of?",
    'How would you design a scalable REST API from scratch? Which design principles would you follow?',
    'How do you approach debugging a performance issue in a production application? Walk me through your process.',
    'Can you explain the difference between SQL and NoSQL databases and when you would choose each?',
    'Describe the most technically challenging problem you have solved and how you approached it.',
  ],
  hr: [
    'Welcome to your HR interview. Tell me about yourself, your background, and what drives you professionally.',
    'Describe a situation where you had to work under a tight deadline. How did you handle it?',
    'Tell me about a time you disagreed with a teammate. How did you resolve it?',
    'Where do you see yourself in the next three to five years, and how does this role fit those goals?',
    'What do you consider your greatest achievement so far, and why?',
  ],
  mixed: [
    'Welcome to your interview. We will cover technical and behavioural topics. Please introduce yourself and tell me what you have been working on recently.',
    'Walk me through a recent project you built: the technologies, the challenges, and how you overcame them.',
    'Tell me about a time you had to learn a new technology quickly. How did you approach it?',
    'Explain RESTful API design and the characteristics of a well-designed API.',
    'How do you keep your skills current in a fast-changing industry?',
  ],
};

const fallbackFirstQuestion = (type) => (QUESTIONS[type] || QUESTIONS.mixed)[0];

const fallbackContinue = (messages, type) => {
  const qs = QUESTIONS[type] || QUESTIONS.mixed;
  const answered = messages.filter((m) => m.role === 'user').length;
  const acks = ['Thank you for that answer.', 'That is a useful example.', 'I appreciate the detail.', 'Good, thank you.'];
  const ack = acks[answered % acks.length];
  if (answered >= qs.length) {
    return `${ack} Before we wrap up, is there anything about your experience that we have not covered yet?`;
  }
  return `${ack} ${qs[answered]}`;
};

const fallbackFeedback = (messages) => {
  const answers = messages.filter((m) => m.role === 'user');
  const avgLen = answers.reduce((s, m) => s + m.content.length, 0) / Math.max(answers.length, 1);
  // Deterministic heuristic: longer, more detailed answers score higher (bounded 45-80)
  const base = Math.min(Math.max(Math.round(40 + (avgLen / 250) * 25), 45), 80);
  return {
    overallScore: base,
    communication: base,
    technical: base,
    problemSolving: base,
    confidence: base,
    strengths: [
      'Completed the full interview session',
      avgLen > 150 ? 'Gave detailed answers' : 'Answered every question',
    ],
    improvements: [
      'Use the STAR method (Situation, Task, Action, Result) for behavioural answers',
      'Support claims with specific numbers and outcomes',
    ],
    summary: `Heuristic assessment of a ${answers.length}-answer session (AI evaluation was temporarily unavailable). Scores reflect answer depth only.`,
    recommendations: [
      'Prepare three or four strong project stories with measurable impact',
      'Practise explaining trade-offs behind your technical decisions',
      'Retake this interview later for detailed AI feedback',
    ],
  };
};

// ─── Public API ─────────────────────────────────────────────────────────────

const analyzeResume = async (resumeText) => {
  try {
    const prompt = `You are an expert technical recruiter. Analyse the resume below and return ONLY a valid JSON object (no markdown, no explanation).

Resume:
"""
${resumeText.substring(0, 6000)}
"""

Return exactly this JSON structure:
{
  "summary": "2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": ["key experience point 1", "key experience point 2"],
  "education": ["education detail 1"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missingSkills": ["missing skill 1", "missing skill 2", "missing skill 3"],
  "overallScore": 72,
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

overallScore must be a realistic integer from 0 to 100. Base every point on the resume text only.`;
    const text = await generate(prompt);
    return { ...normalizeResumeAnalysis(parseJSON(text)), source: 'ai' };
  } catch (err) {
    logFallback('analyzeResume', err);
    return { ...fallbackResumeAnalysis(resumeText), source: 'fallback' };
  }
};

const generateInterviewQuestion = async (role, type, resumeText = '', difficulty = 'medium') => {
  try {
    const prompt = `You are a professional interviewer conducting a ${type} interview for the role of ${role} at ${difficulty} difficulty.
${resumeText ? `\nCandidate background (from resume):\n${resumeText.substring(0, 1200)}\n` : ''}
Greet the candidate briefly and ask exactly ONE clear opening question tailored to the role${resumeText ? ' and their background' : ''}.
Be conversational and professional. Do NOT use bullet points or markdown. Keep it to 2-4 sentences.`;
    return await generate(prompt, { fast: true, maxTokens: 300 });
  } catch (err) {
    logFallback('generateInterviewQuestion', err);
    return fallbackFirstQuestion(type);
  }
};

const continueInterview = async (messages, role, type, difficulty = 'medium') => {
  try {
    const prompt = `You are an expert ${type} interviewer for the role of ${role} (difficulty: ${difficulty}).

RULES:
- Briefly acknowledge the candidate's last answer in one sentence, referring to something specific they said
- Ask exactly ONE follow-up question that probes deeper into their last answer or moves to a new relevant topic if that topic is exhausted
- Do not repeat a question that was already asked
- 2-4 sentences in total, professional and encouraging
- No bullet points or markdown

Conversation so far:
${transcriptOf(messages, 8000)}

Your response (as Interviewer):`;
    return await generate(prompt, { fast: true, maxTokens: 300 });
  } catch (err) {
    logFallback('continueInterview', err);
    return fallbackContinue(messages, type);
  }
};

const generateFeedback = async (messages, role, type) => {
  try {
    const prompt = `You are an expert technical recruiter who just conducted a ${type} interview for the role of ${role}.

Evaluate the candidate using this rubric (each score is an integer 0-100):
- communication: clarity, structure (e.g. STAR), conciseness
- technical: correctness and depth of technical content
- problemSolving: reasoning, trade-offs, handling of follow-ups
- confidence: directness and ownership of decisions
- overallScore: holistic hiring signal, not a plain average

Transcript:
"""
${transcriptOf(messages, 12000)}
"""

Return ONLY this JSON (no markdown, no explanation):
{
  "overallScore": 74,
  "communication": 78,
  "technical": 70,
  "problemSolving": 72,
  "confidence": 76,
  "strengths": ["specific strength tied to an actual answer", "...", "..."],
  "improvements": ["specific gap seen in an actual answer", "..."],
  "summary": "2-3 sentence personalised assessment based on the actual answers",
  "recommendations": ["specific, actionable recommendation", "...", "..."]
}`;
    const text = await generate(prompt);
    return { ...normalizeFeedback(parseJSON(text)), source: 'ai' };
  } catch (err) {
    logFallback('generateFeedback', err);
    return { ...fallbackFeedback(messages), source: 'fallback' };
  }
};

module.exports = {
  analyzeResume,
  generateInterviewQuestion,
  continueInterview,
  generateFeedback,
  // exported for unit tests
  _internal: { parseJSON, normalizeFeedback, normalizeResumeAnalysis, clampScore, transcriptOf, fallbackResumeAnalysis, hasSkill },
  MODELS: { MODEL, FAST_MODEL },
};
