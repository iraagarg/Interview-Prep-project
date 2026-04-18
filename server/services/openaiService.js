/**
 * AI Service — powered by Groq (FREE, no payment needed)
 * Fallback: smart rule-based responses when API key is not set
 *
 * Get your FREE Groq API key at: https://console.groq.com
 * (Sign in with Google, click "API Keys" → "Create API Key")
 */

const Groq = require('groq-sdk');

// ─── Groq Client ────────────────────────────────────────────────────────────
const getClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here' || key.length < 10) return null;
  return new Groq({ apiKey: key });
};

const MODEL = 'llama-3.3-70b-versatile'; // Best quality, free tier
const FAST_MODEL = 'llama-3.1-8b-instant'; // Faster for interview chat

const generate = async (prompt, fast = false) => {
  const client = getClient();
  if (!client) throw new Error('NO_API_KEY');

  const completion = await client.chat.completions.create({
    model: fast ? FAST_MODEL : MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || '';
};

const parseJSON = (text) => {
  // Remove markdown code fences if present
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the JSON object/array from the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
};

// ─── Smart Fallback (no API key / network error) ────────────────────────────
const SKILL_LIST = [
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Ruby','PHP','Swift','Kotlin','Rust',
  'React','Angular','Vue','Next.js','Nuxt','Svelte',
  'Node.js','Express','Django','Flask','FastAPI','Spring Boot','Laravel',
  'MongoDB','MySQL','PostgreSQL','SQLite','Redis','Firebase','DynamoDB','Cassandra',
  'HTML','CSS','SCSS','Sass','Tailwind CSS','Bootstrap','Material UI',
  'Docker','Kubernetes','AWS','Azure','GCP','Heroku','Vercel','Netlify',
  'Git','GitHub','GitLab','CI/CD','Jenkins','GitHub Actions','Terraform',
  'REST API','GraphQL','WebSocket','gRPC','Microservices',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy',
  'Linux','Bash','Agile','Scrum','JIRA','Figma','Postman','Swagger',
];

const buildFallbackResumeAnalysis = (text) => {
  const lower = text.toLowerCase();
  const found = SKILL_LIST.filter(s => lower.includes(s.toLowerCase()));

  let score = 30;
  score += Math.min(found.length * 3, 25);
  score += Math.min(Math.floor(text.length / 200), 15);
  if (lower.includes('experience') || lower.includes('worked'))  score += 5;
  if (lower.includes('education') || lower.includes('university') || lower.includes('degree')) score += 5;
  if (lower.includes('project') || lower.includes('built') || lower.includes('developed')) score += 7;
  if (lower.includes('github') || lower.includes('portfolio') || lower.includes('linkedin')) score += 5;
  if (lower.includes('award') || lower.includes('achievement') || lower.includes('certified')) score += 5;
  score = Math.min(score, 92);

  const missing = ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'GraphQL', 'TypeScript']
    .filter(s => !lower.includes(s.toLowerCase()))
    .slice(0, 3);

  return {
    summary: `Candidate demonstrates proficiency in ${found.length} technical skills. The resume is ${text.length > 1500 ? 'comprehensive and well-structured' : 'concise'}. Add a Groq API key for full AI-powered analysis.`,
    skills: found.length ? found.slice(0, 12) : ['Programming', 'Software Development'],
    experience: ['Professional experience present in resume', 'Add Groq API key for detailed experience extraction'],
    education: ['Education background identified'],
    strengths: [
      found.length >= 5 ? 'Strong and diverse technical skill set' : 'Technical skills present',
      text.length > 1000 ? 'Detailed and well-written resume' : 'Clear and concise resume',
      lower.includes('project') ? 'Project experience demonstrated' : 'Add projects for stronger profile',
    ],
    weaknesses: [
      'Add Groq API key for AI-powered weakness identification',
      'Consider adding quantifiable achievements (e.g., "Improved performance by 40%")',
    ],
    missingSkills: missing,
    overallScore: score,
    recommendations: [
      '🔑 Add your free Groq API key in server/.env as GROQ_API_KEY for real AI analysis',
      'Add measurable impact metrics to each experience bullet point',
      'Include a GitHub profile or portfolio link if not already present',
      'Consider adding a professional summary at the top of your resume',
    ],
  };
};

const QUESTIONS = {
  technical: [
    "Hello! Welcome to your technical interview. I'm excited to learn more about your background. To start — could you briefly introduce yourself and walk me through your technical background and the projects you're most proud of?",
    "Great! Now let's dive deeper — can you explain how you would design a scalable REST API from scratch? What are the key design principles you'd follow?",
    "Excellent answer! Let's test your problem-solving — how do you approach debugging a performance issue in a production application? Walk me through your process step by step.",
    "Insightful! On the database side — can you explain the difference between SQL and NoSQL databases and when you'd choose one over the other?",
    "Great thinking! Last question — describe the most technically challenging problem you've ever solved and how you approached it.",
  ],
  hr: [
    "Hello! Welcome to your HR interview. I'm looking forward to getting to know you. Let's start with the classic — tell me about yourself, your background, and what drives you professionally.",
    "Thank you for sharing that! Now — can you describe a situation where you had to work under a tight deadline or high pressure? How did you handle it?",
    "That's a great example! Tell me about a time you had a conflict or disagreement with a teammate or manager. How did you resolve it?",
    "Very insightful! Where do you see yourself professionally in the next 3 to 5 years, and how does this role align with those goals?",
    "Excellent! Final question — what do you consider your single greatest professional achievement, and why does it stand out to you?",
  ],
  mixed: [
    "Hello! Welcome to your interview. I'll be covering both technical and behavioral aspects today. Let's begin — please introduce yourself: your background, what you've been working on recently, and what excites you most about this role.",
    "Excellent! On the technical side — walk me through a recent project you built. What technologies did you use, what challenges did you face, and how did you overcome them?",
    "Great answer! Behaviorally — tell me about a time you had to quickly learn a new technology or framework under time pressure. How did you approach it?",
    "Very good! Back to technical — explain the concept of RESTful API design and describe the characteristics of a well-designed API.",
    "Wonderful! Final question — how do you stay updated with the rapidly changing tech landscape? What resources or habits help you keep your skills current?",
  ],
};

const buildFallbackFirstQuestion = (type) =>
  QUESTIONS[type]?.[0] || QUESTIONS.mixed[0];

const buildFallbackContinue = (messages, type) => {
  const qs = QUESTIONS[type] || QUESTIONS.mixed;
  const userCount = messages.filter(m => m.role === 'user').length;
  const acks = [
    'Thank you for that response!',
    "That's a really great point!",
    'I appreciate your detailed answer!',
    'Very insightful, thank you!',
    'Excellent perspective!',
  ];
  const ack = acks[userCount % acks.length];
  if (userCount >= qs.length - 1) {
    return `${ack} We're nearing the end of our session. Last question — do you have any questions for us? And is there anything important about yourself or your experience that we haven't yet covered?`;
  }
  return `${ack} ${qs[userCount]}`;
};

const buildFallbackFeedback = (messages) => {
  const userMsgs = messages.filter(m => m.role === 'user');
  const avgLen = userMsgs.reduce((s, m) => s + m.content.length, 0) / Math.max(userMsgs.length, 1);
  const base = Math.min(Math.max(Math.round(40 + (avgLen / 250) * 25), 50), 85);
  const jitter = () => Math.floor(Math.random() * 10) - 5;
  return {
    overallScore: base,
    communication: Math.min(Math.max(base + jitter(), 40), 95),
    technical:     Math.min(Math.max(base + jitter(), 40), 95),
    problemSolving:Math.min(Math.max(base + jitter(), 40), 95),
    confidence:    Math.min(Math.max(base + jitter(), 40), 95),
    strengths: [
      'Actively engaged throughout the interview',
      avgLen > 150 ? 'Provided detailed and thoughtful answers' : 'Answered all questions clearly',
      'Demonstrated structured thinking',
    ],
    improvements: [
      '🔑 Add your free Groq API key for personalized AI feedback on your actual answers',
      'Use the STAR method (Situation, Task, Action, Result) for behavioral answers',
      'Quantify your achievements with specific numbers and measurable outcomes',
    ],
    summary: `You completed a ${userMsgs.length}-question mock interview session and showed good engagement. Add a free Groq API key (console.groq.com) to GROQ_API_KEY in server/.env to unlock real AI-powered personalized feedback.`,
    recommendations: [
      '🔑 Sign up free at console.groq.com and set GROQ_API_KEY in server/.env for AI analysis',
      'Practice the STAR method for behavioral questions',
      'Prepare 3-4 strong project examples with measurable impact',
      'Research common interview questions for your specific target role',
    ],
  };
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze a resume and return structured insights
 */
const analyzeResume = async (resumeText) => {
  try {
    const prompt = `You are an expert HR recruiter and technical hiring manager. Analyze the resume below and return ONLY a valid JSON object (no markdown, no explanation, no code blocks).

Resume:
"""
${resumeText.substring(0, 3000)}
"""

Return ONLY this JSON structure:
{
  "summary": "2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": ["key experience point 1", "key experience point 2", "key experience point 3"],
  "education": ["education detail 1"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missingSkills": ["missing skill 1", "missing skill 2", "missing skill 3"],
  "overallScore": 72,
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

overallScore must be a realistic integer from 0 to 100.`;

    const text = await generate(prompt, false);
    return parseJSON(text);
  } catch (err) {
    if (err.message !== 'NO_API_KEY') {
      console.error('⚠️  Groq AI error (using fallback):', err.message?.slice(0, 120));
    } else {
      console.log('ℹ️  No Groq API key set — using smart fallback analysis');
    }
    return buildFallbackResumeAnalysis(resumeText);
  }
};

/**
 * Generate the opening interview question
 */
const generateInterviewQuestion = async (role, type, resumeText = '', difficulty = 'medium') => {
  try {
    const prompt = `You are a professional interviewer conducting a ${type} interview for the role of ${role} at ${difficulty} difficulty level.
${resumeText ? `\nCandidate background (from resume):\n${resumeText.substring(0, 600)}\n` : ''}
Greet the candidate warmly and ask exactly ONE clear, relevant opening question tailored to the role.
Be conversational and professional. Do NOT use bullet points or markdown. Keep it to 3-5 sentences total.`;

    return await generate(prompt, true);
  } catch (err) {
    if (err.message !== 'NO_API_KEY') {
      console.error('⚠️  Groq error (using fallback question):', err.message?.slice(0, 80));
    }
    return buildFallbackFirstQuestion(type);
  }
};

/**
 * Generate the next interviewer message in the conversation
 */
const continueInterview = async (messages, role, type, difficulty = 'medium') => {
  try {
    const history = messages
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are an expert ${type} interviewer for the role of ${role} (difficulty: ${difficulty}).

RULES:
- Briefly acknowledge the candidate's last answer in 1 sentence
- Ask exactly ONE clear follow-up question
- Total response: 3-5 sentences maximum
- Be encouraging and professional
- Do NOT use bullet points or markdown formatting

Conversation history:
${history}

Your response (as Interviewer):`;

    return await generate(prompt, true);
  } catch (err) {
    if (err.message !== 'NO_API_KEY') {
      console.error('⚠️  Groq error (using fallback):', err.message?.slice(0, 80));
    }
    return buildFallbackContinue(messages, type);
  }
};

/**
 * Generate detailed interview feedback after session ends
 */
const generateFeedback = async (messages, role, type) => {
  try {
    const transcript = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an expert technical recruiter who just conducted a ${type} interview for the role of ${role}.

Analyze this interview transcript and return ONLY a valid JSON object (no markdown, no explanation, no code blocks).

Transcript:
"""
${transcript.substring(0, 3500)}
"""

Return ONLY this JSON:
{
  "overallScore": 74,
  "communication": 78,
  "technical": 70,
  "problemSolving": 72,
  "confidence": 76,
  "strengths": ["specific strength 1 based on answers", "specific strength 2", "specific strength 3"],
  "improvements": ["specific area to improve 1", "specific area to improve 2"],
  "summary": "2-3 sentence personalized assessment of this candidate based on their actual answers",
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2", "specific actionable recommendation 3"]
}

All scores must be realistic integers from 0-100 based on the actual answers given.`;

    const text = await generate(prompt, false);
    return parseJSON(text);
  } catch (err) {
    if (err.message !== 'NO_API_KEY') {
      console.error('⚠️  Groq error (using fallback feedback):', err.message?.slice(0, 80));
    }
    return buildFallbackFeedback(messages);
  }
};

module.exports = {
  analyzeResume,
  generateInterviewQuestion,
  continueInterview,
  generateFeedback,
};
