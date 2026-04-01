import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4o";

/**
 * Generate interview questions using OpenAI
 */
export const generateInterviewQuestions = async ({ role, level, techstack, type, amount }) => {
  const systemMessage = `You are an expert technical interviewer. You always respond with valid JSON objects.`;

  const prompt = `Job Role: ${role}
Experience Level: ${level}
Tech Stack: ${techstack}
Question Focus (behavioural/technical): ${type}
Number of Questions: ${amount}

Instructions:
- Generate exactly ${amount} interview questions.
- The questions should focus on ${type} aspects, using the provided tech stack and experience level.
- Do not include any additional text, explanations, or formatting symbols.
- Ensure the language is clear and appropriate for a voice assistant.

Return ONLY this JSON format:
{ "questions": ["Question 1", "Question 2", ...] }`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.questions || [];
};

/**
 * Analyze interview answers + facial data
 */
export const analyzeInterviewAnswers = async ({ questions, answers, facialData }) => {
  const safeFacialData = facialData || { confidence: 0, stress: 0, eyeContact: 0, blinkRate: 0 };
  const prompt = `You are an advanced AI interview evaluator. Analyze the candidate's performance and return ONLY a valid JSON object with no extra text.

Input:
{
  "questions": ${JSON.stringify(questions)},
  "answers": ${JSON.stringify(answers)},
  "facialData": {
    "confidence": ${safeFacialData.confidence},
    "stress": ${safeFacialData.stress},
    "eyeContact": ${safeFacialData.eyeContact},
    "blinkRate": ${safeFacialData.blinkRate}
  }
}

Return this exact JSON format:
{
  "accuracy": <number 0-10>,
  "fluency": <number 0-10>,
  "communication": <number 0-10>,
  "confidence": <number 0-10>,
  "stress": <number 0-10>,
  "eyeContact": <number 0-10>,
  "blinkRate": <number>,
  "overall": <number 0-10>,
  "clarity": <number 0-10>,
  "engagement": <number 0-10>,
  "domainExpertise": <number 0-10>,
  "improvements": [<5 strings>],
  "feedback": [<5 strings>],
  "mistakes": [<5 strings>],
  "questionFeedback": [<one string per question>],
  "nextSteps": [<5 strings>]
}`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert AI interview evaluator. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(result.choices[0].message.content);
};

/**
 * Generate a personalized AI study roadmap based on interview weaknesses
 */
export const generateStudyRoadmap = async ({ role, level, techstack, mistakes, improvements, overall, recurringWeaknesses = [], sessionHistory = [], trend = "unknown" }) => {
  const recurringSection = recurringWeaknesses.length > 0
    ? `\n- RECURRING weak areas (appeared across multiple sessions — HIGHEST PRIORITY): ${JSON.stringify(recurringWeaknesses)}`
    : "";

  const historySection = sessionHistory.length > 1
    ? `\n- Session history (oldest first): ${sessionHistory.map(s => `Score ${s.overall}/10`).join(" → ")}`
    : "";

  const prompt = `You are an expert technical interview coach. A candidate completed a ${role} interview at ${level} level using ${techstack}.

Performance context:
- Latest overall score: ${overall}/10
- Performance trend: ${trend}${historySection}${recurringSection}
- Latest session mistakes: ${JSON.stringify(mistakes)}
- Latest session improvements needed: ${JSON.stringify(improvements)}

Important instruction: If there are RECURRING weak areas, dedicate the first 1-2 weeks primarily to those. Do not waste time on one-off mistakes.

Generate a personalized 4-week study roadmap. Return ONLY this JSON format:
{
  "title": "<roadmap title>",
  "summary": "<2-sentence summary mentioning the trend and top focus area>",
  "estimatedHours": <total hours>,
  "weeks": [
    {
      "week": 1,
      "theme": "<week theme>",
      "topics": [
        {
          "title": "<topic name>",
          "description": "<why this matters>",
          "resources": [
            { "type": "video|docs|article|practice", "title": "<resource title>", "url": "<actual URL if known, else empty string>" }
          ],
          "estimatedHours": <number>,
          "priority": "high|medium|low"
        }
      ]
    }
  ],
  "keySkillsToMaster": [<array of 5 skill strings>],
  "practiceProjects": [<array of 3 project idea strings>]
}`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert technical interview coach. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(result.choices[0].message.content);
};

/**
 * Generate AI commentary on a single Q&A pair during replay
 */
export const generateAnswerCommentary = async ({ question, answer, role, level }) => {
  const prompt = `You are an expert ${role} interviewer at ${level} level. Analyze this single Q&A:

Question: "${question}"
Candidate's Answer: "${answer}"

Return ONLY this JSON:
{
  "score": <number 0-10>,
  "strengths": [<2-3 strength strings>],
  "gaps": [<2-3 gap strings>],
  "idealAnswer": "<brief ideal answer outline>",
  "tip": "<one actionable tip>",
  "verdict": "excellent|good|average|needs_improvement"
}`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert interviewer. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(result.choices[0].message.content);
};

/**
 * Generate questions from a question bank entry (for custom interviews)
 */
export const generateQuestionsFromBank = async ({ selectedQuestions, additionalRole, amount }) => {
  const prompt = `Based on these ${selectedQuestions.length} seed questions for a ${additionalRole} role, generate ${amount} interview questions of similar style and difficulty.

Seed questions: ${JSON.stringify(selectedQuestions.map(q => q.question))}

Return ONLY: { "questions": ["Q1", "Q2", ...] }`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert interviewer. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.questions || [];
};

/**
 * Generate a 2–3 sentence AI commentary explaining score changes between two sessions
 */
export const generateProgressCommentary = async ({ sessionA, sessionB, deltas }) => {
  const improvements = Object.entries(deltas)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k} improved by ${v.toFixed(1)}`)
    .join(", ");

  const declines = Object.entries(deltas)
    .filter(([, v]) => v < 0)
    .map(([k, v]) => `${k} dropped by ${Math.abs(v).toFixed(1)}`)
    .join(", ");

  const prompt = `You are an interview coach. A candidate went from an overall score of ${sessionA.overall}/10 to ${sessionB.overall}/10.

Improvements: ${improvements || "none"}
Declines: ${declines || "none"}
Role: ${sessionB.role || "software engineer"}

Write 2-3 concise, encouraging but honest sentences explaining what likely caused these changes and one key focus area. Be specific, not generic.

Return ONLY: { "commentary": "<your 2-3 sentences>" }`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an interview coach. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.commentary || "";
};

/**
 * Generate resume-based interview questions from extracted resume text
 */
export const generateResumeBasedQuestions = async ({ resumeText, role, level, amount }) => {
  const trimmedResume = resumeText.substring(0, 3500); // safety cap

  const prompt = `You are a senior ${role} interviewer at ${level} level conducting a resume-based interview.

Here is the candidate's resume:
---
${trimmedResume}
---

Generate exactly ${amount} interview questions that:
1. Reference SPECIFIC projects, technologies, or experiences mentioned in the resume
2. Probe the depth of their stated skills — don't just ask what is listed, ask HOW and WHY
3. Ask about real tradeoffs or decisions implied by their experience
4. Vary difficulty: 40% foundational, 40% intermediate, 20% advanced
5. Are phrased naturally for a voice interview (clear, conversational)

Return ONLY: { "questions": ["Q1", "Q2", ...] }`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a senior technical interviewer. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.questions || [];
};

/**
 * Parse a resume text and extract structured profile info
 */
export const parseResumeProfile = async ({ resumeText }) => {
  const trimmedResume = resumeText.substring(0, 4000);

  const prompt = `Extract structured information from this resume. Return ONLY this JSON:
{
  "detectedRole": "<most likely job role, e.g. Frontend Developer>",
  "skills": ["skill1", "skill2"],
  "experienceYears": <number or null>,
  "level": "<fresher|junior|mid|senior|lead>",
  "topProjects": ["<project 1 summary>", "<project 2 summary>"],
  "keyTechnologies": ["tech1", "tech2"],
  "summary": "<2 sentence professional summary>"
}

Resume:
---
${trimmedResume}
---`;

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a resume parsing expert. Always respond with a valid JSON object." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(result.choices[0].message.content);
};

/**
 * Use OpenAI web search to find real, curated learning resources
 * based on a user's interview weaknesses.
 */
export const fetchLearningResources = async ({ role, level, techstack, mistakes, improvements }) => {
  // Build a focused search context from the user's weak areas
  const weakAreas = [
    ...(mistakes || []).slice(0, 3),
    ...(improvements || []).slice(0, 3),
  ].join("; ");

  const prompt = `A ${level}-level ${role} candidate (using ${techstack}) just completed a mock interview and struggled with the following areas:

"${weakAreas}"

Search the web and find 6–8 high-quality, real learning resources to help them improve. Mix the types: include video tutorials, official documentation, interactive practice platforms, and articles.

For each resource return:
- title: exact resource title
- url: the actual working URL you found
- description: 1–2 sentences on what it teaches and why it helps
- type: one of "video", "article", "docs", "practice"
- topic: which weak area this helps with (short label, e.g. "System Design", "React Hooks")

Return ONLY this JSON format:
{
  "resources": [
    {
      "title": "...",
      "url": "...",
      "description": "...",
      "type": "video|article|docs|practice",
      "topic": "..."
    }
  ]
}`;

  const result = await client.chat.completions.create({
    model: "gpt-4o-search-preview",
    messages: [{ role: "user", content: prompt }],
    web_search_options: {},
  });

  const raw = result.choices[0].message.content;

  // Extract JSON from response (web search model may add prose around it)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.resources || [];
  } catch {
    return [];
  }
};
