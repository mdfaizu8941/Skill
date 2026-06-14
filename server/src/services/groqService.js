import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

/**
 * Creates a promise that rejects after `ms` milliseconds.
 */
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Groq request timed out after ${ms}ms`)), ms)
  );

const TIMEOUT_MS = 15_000;

/**
 * Extract skills from resume text using Groq LLM.
 * @param {string} resumeText - Raw text extracted from a PDF resume
 * @returns {Promise<string[]>} Array of skill name strings
 */
export const extractSkillsFromResume = async (resumeText) => {
  try {
    const response = await Promise.race([
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL_LARGE || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a resume skill extractor. Extract technical and domain-specific skills from the resume text. Focus on programming languages, frameworks, tools, platforms, and technologies. Exclude generic soft skills like communication, teamwork, leadership, and time management. Return ONLY a JSON array of skill name strings. No preamble, no markdown, no explanation.',
          },
          {
            role: 'user',
            content: resumeText,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
      timeout(TIMEOUT_MS),
    ]);

    const text = response.choices[0]?.message?.content?.trim() || '[]';

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('extractSkillsFromResume error:', error.message);
    return [];
  }
};

/**
 * Generate a brief explanation of a student's skill gap relative to a career role.
 * @param {string[]} matchedSkills
 * @param {Array<{skillName: string}>} missingSkills
 * @param {string} careerRoleTitle
 * @returns {Promise<string>}
 */
export const generateGapExplanation = async (matchedSkills, missingSkills, careerRoleTitle) => {
  try {
    const missingNames = missingSkills.map((s) => s.skillName).join(', ');
    const matchedNames = matchedSkills.join(', ');

    const response = await Promise.race([
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a career advisor. Provide a concise, encouraging explanation.',
          },
          {
            role: 'user',
            content: `A student wants to become a "${careerRoleTitle}". They already have these skills: ${matchedNames || 'none'}. They are missing these skills: ${missingNames || 'none'}. Explain in 3-4 sentences what the student is good at and what they need to learn. Be specific and constructive.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
      timeout(TIMEOUT_MS),
    ]);

    return response.choices[0]?.message?.content?.trim() || 'Unable to generate explanation.';
  } catch (error) {
    console.error('generateGapExplanation error:', error.message);
    return 'Unable to generate explanation at this time.';
  }
};

/**
 * Generate a learning roadmap for missing skills.
 * @param {Array<{skillName: string, level: string, weight: number}>} missingSkills
 * @param {string} careerRoleTitle
 * @returns {Promise<Array<{title: string, description: string, resourceUrl: string|null, order: number}>>}
 */
export const generateRoadmap = async (missingSkills, careerRoleTitle) => {
  const defaultStep = [
    {
      title: `Learn fundamentals for ${careerRoleTitle}`,
      description: 'Start by researching the core skills required for this role.',
      resourceUrl: null,
      order: 1,
    },
  ];

  try {
    const skillList = missingSkills
      .map((s) => `${s.skillName} (level: ${s.level}, priority weight: ${s.weight})`)
      .join('\n');

    const response = await Promise.race([
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL_LARGE || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a career roadmap generator. Return ONLY a JSON array. Each item must have: title (string), description (string), resourceUrl (string or null), order (number). No preamble, no markdown.',
          },
          {
            role: 'user',
            content: `Generate a step-by-step learning roadmap for a student who wants to become a "${careerRoleTitle}". They need to learn the following skills:\n${skillList}\n\nCreate actionable learning steps ordered by priority.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      timeout(TIMEOUT_MS),
    ]);

    const text = response.choices[0]?.message?.content?.trim() || '[]';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultStep;
    } catch {
      return defaultStep;
    }
  } catch (error) {
    console.error('generateRoadmap error:', error.message);
    return defaultStep;
  }
};

/**
 * Extract structured skills from a job description using Groq LLM.
 * @param {string} jdText - Job description or role prompt text
 * @returns {Promise<Array<{skillName: string, level: string, weight: number}>>}
 */
export const extractSkillsFromJD = async (jdText) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Groq timeout')), 15000)
  )

  const request = groq.chat.completions.create({
    model: process.env.GROQ_MODEL_LARGE,
    messages: [
      {
        role: 'system',
        content: 'You are a skill extractor. Extract required skills from the job description or role prompt. Return ONLY a JSON array of objects with shape { skillName: string, level: "beginner"|"intermediate"|"advanced", weight: number between 1 and 10 }. Focus on technical and domain-specific skills only. Exclude generic soft skills such as communication, teamwork, leadership, time management, adaptability, problem solving, collaboration, and mentorship. No preamble, no markdown.',
      },
      { role: 'user', content: jdText },
    ],
    max_tokens: 1000,
  })

  try {
    const response = await Promise.race([request, timeoutPromise])
    const text = response.choices[0]?.message?.content || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return []
  }
}
