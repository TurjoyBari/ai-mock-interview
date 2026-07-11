import type { InterviewConfig, AnswerAnalysis, ResumeAnalysis, JobMatchResult, InterviewReportData, AnswerCoaching } from "@/types";
import { INTERVIEW_TYPE_PROFILES } from "@/lib/prompts/interview-types";
import {
  buildFallbackIdealAnswer,
  buildFallbackPracticeVersion,
  ensureValidIdealAnswer,
  ensureValidPracticeVersion,
  isPlaceholderIdealAnswer,
} from "@/lib/ai/ideal-answers";

const QUESTION_BANK: Record<string, string[]> = {
  hr: [
    "Tell me about yourself and what motivated you to apply for this role.",
    "Why do you want to work at our company?",
    "Describe a time you handled a difficult situation at work.",
    "What are your salary expectations and notice period?",
    "Where do you see yourself in five years?",
    "What is your greatest professional strength?",
    "Tell me about a time you received constructive criticism.",
    "Why should we hire you over other candidates?",
    "How do you handle stress and tight deadlines?",
    "Do you have any questions for us?",
  ],
  behavioral: [
    "Tell me about a time you demonstrated leadership.",
    "Describe a situation where you had a conflict with a teammate. How did you resolve it?",
    "Give an example of when you failed and what you learned.",
    "Tell me about a time you went above and beyond for a project.",
    "Describe a situation where you had to persuade others.",
    "Tell me about a time you worked under pressure.",
    "Give an example of when you showed initiative.",
    "Describe a time you had to learn something quickly.",
    "Tell me about your proudest professional achievement.",
    "How do you prioritize when you have multiple deadlines?",
  ],
  technical: [
    "Explain the difference between SQL and NoSQL databases. When would you use each?",
    "How does HTTP work? Explain the request-response cycle.",
    "What is the difference between concurrency and parallelism?",
    "Explain how caching improves application performance.",
    "What are microservices and what are their trade-offs?",
    "How do you approach debugging a production issue?",
    "Explain REST API design principles.",
    "What is CI/CD and why is it important?",
    "How do you ensure code quality in a team environment?",
    "Describe how you would design a URL shortening service.",
  ],
  coding: [
    "Reverse a linked list. Walk me through your approach before coding.",
    "Find two numbers in an array that sum to a target value.",
    "Implement a function to check if a string is a palindrome.",
    "Find the longest substring without repeating characters.",
    "Merge two sorted arrays into one sorted array.",
    "Detect a cycle in a linked list.",
    "Implement binary search on a sorted array.",
    "Find the maximum depth of a binary tree.",
    "Validate if parentheses in a string are balanced.",
    "Design an algorithm to find duplicate elements in an array.",
  ],
  system_design: [
    "Design a scalable notification system.",
    "How would you design Twitter's news feed?",
    "Design a rate limiter for an API.",
    "How would you design a distributed cache?",
    "Design a video streaming platform like YouTube.",
    "How would you handle 1 million concurrent WebSocket connections?",
    "Design a search autocomplete system.",
    "How would you design an e-commerce checkout system?",
    "Design a file storage system like Google Drive.",
    "How would you design a real-time chat application?",
  ],
  frontend: [
    "Explain the browser rendering pipeline from HTML to pixels.",
    "What is the CSS box model and how does it affect layout?",
    "How does event delegation work in the DOM?",
    "Explain CORS and how you handle cross-origin requests.",
    "What strategies do you use to optimize frontend performance?",
    "How do you approach responsive design for mobile and desktop?",
    "Explain the difference between reflow and repaint.",
    "How do you ensure accessibility in web applications?",
    "What is the virtual DOM and why do frameworks use it?",
    "How do you manage state in large frontend applications?",
  ],
  backend: [
    "Explain RESTful API design principles and when you'd break them.",
    "How do you design database schemas for a high-traffic application?",
    "What is the difference between authentication and authorization?",
    "How do you handle idempotency in API endpoints?",
    "Explain caching strategies at the backend layer.",
    "How do you approach error handling and logging in production?",
    "What are the trade-offs between monolith and microservices?",
    "How do you secure APIs against common vulnerabilities?",
    "Explain database indexing and when it helps or hurts.",
    "How do you design for horizontal scalability?",
  ],
  fullstack: [
    "Walk me through the full lifecycle of a user login request from browser to database.",
    "How do you decide what logic belongs on the frontend vs backend?",
    "Explain SSR vs CSR and when you'd choose each.",
    "How do you handle authentication across frontend and backend?",
    "Describe how you'd build a real-time feature end to end.",
    "What are trade-offs between SQL and NoSQL for a fullstack app?",
    "How do you manage API versioning with a SPA frontend?",
    "Explain how you'd deploy a fullstack application.",
    "How do you handle file uploads across the stack?",
    "Describe error handling from UI to API to database.",
  ],
  database: [
    "Explain ACID properties and why they matter.",
    "What is the difference between clustered and non-clustered indexes?",
    "When would you denormalize a database schema?",
    "Explain the different types of SQL JOINs with examples.",
    "How do you optimize a slow SQL query?",
    "What is database sharding and when is it needed?",
    "Explain transaction isolation levels.",
    "How do you model many-to-many relationships?",
    "What are the trade-offs between SQL and NoSQL?",
    "How do you handle database migrations in production?",
  ],
  javascript: [
    "Explain the JavaScript event loop and how async code executes.",
    "What is a closure and give a practical use case.",
    "Explain the difference between var, let, and const.",
    "How does prototypal inheritance work in JavaScript?",
    "What is the difference between == and ===?",
    "Explain Promise, async/await, and error handling patterns.",
    "What is hoisting in JavaScript?",
    "How does this binding work in different contexts?",
    "Explain debouncing and throttling with use cases.",
    "What are ES6 modules and how do they differ from CommonJS?",
  ],
  react: [
    "Explain how React reconciliation works.",
    "What is the purpose of useEffect and what are dependency arrays?",
    "When would you use useMemo vs useCallback?",
    "Explain controlled vs uncontrolled components.",
    "How does React Context work and when should you avoid it?",
    "What causes unnecessary re-renders and how do you prevent them?",
    "Explain the React component lifecycle in functional components.",
    "How do you handle forms in React?",
    "What are React Server Components and how do they differ from Client Components?",
    "How do you test React components effectively?",
  ],
  nextjs: [
    "Explain the difference between SSR, SSG, and ISR in Next.js.",
    "When would you use Server Components vs Client Components?",
    "How does Next.js App Router handle routing and layouts?",
    "Explain Next.js caching strategies (fetch cache, router cache, full route cache).",
    "How do you implement authentication in a Next.js application?",
    "What is Next.js middleware and what are common use cases?",
    "How do you optimize images and fonts in Next.js?",
    "Explain data fetching patterns in the App Router.",
    "How do you handle API routes vs Server Actions?",
    "What are trade-offs between Pages Router and App Router?",
  ],
  nodejs: [
    "Explain the Node.js event loop and its phases.",
    "What is the difference between streams and buffers?",
    "How do you handle errors in async Express middleware?",
    "Explain the cluster module vs worker threads.",
    "How do you prevent blocking the event loop?",
    "What are common security practices for Node.js APIs?",
    "How do you structure a scalable Node.js application?",
    "Explain middleware pattern in Express.",
    "How do you handle environment configuration in Node.js?",
    "What is backpressure in Node.js streams?",
  ],
  typescript: [
    "Explain generics in TypeScript with a practical example.",
    "What is the difference between interface and type alias?",
    "How do type guards and narrowing work?",
    "Explain utility types like Pick, Omit, and Partial.",
    "What does strict mode enable and why use it?",
    "How do conditional types work?",
    "Explain the any vs unknown vs never types.",
    "How do you type React components and hooks in TypeScript?",
    "What are mapped types and when are they useful?",
    "How do you handle third-party libraries without types?",
  ],
  python: [
    "Explain the Global Interpreter Lock (GIL) and its implications.",
    "What are decorators and how do you write one?",
    "Explain generators vs iterators.",
    "How does asyncio work in Python?",
    "What are list comprehensions and when to use them?",
    "Explain Python's memory management and garbage collection.",
    "How do you handle exceptions effectively in Python?",
    "What is the difference between deep copy and shallow copy?",
    "How do you structure a Django/FastAPI project?",
    "Explain duck typing and Python's type hints.",
  ],
  dotnet: [
    "Explain dependency injection in ASP.NET Core.",
    "What is Entity Framework Core and how does change tracking work?",
    "How does async/await work in C#?",
    "Explain LINQ and when to use it vs raw SQL.",
    "What is middleware in ASP.NET Core pipeline?",
    "How do you handle authentication with JWT in .NET?",
    "Explain value types vs reference types in C#.",
    "How does garbage collection work in .NET?",
    "What are records and when should you use them?",
    "How do you optimize EF Core queries?",
  ],
  devops: [
    "Design a CI/CD pipeline for a microservices application.",
    "Explain Docker vs Kubernetes and when to use each.",
    "How do you implement blue-green deployments?",
    "What is infrastructure as code and why use Terraform?",
    "How do you set up monitoring and alerting for production?",
    "Explain container networking basics.",
    "How do you handle secrets management in CI/CD?",
    "What is a service mesh and when is it needed?",
    "How do you troubleshoot a production outage?",
    "Explain GitOps principles.",
  ],
  aiml: [
    "Explain bias-variance tradeoff in machine learning.",
    "What is the difference between fine-tuning and RAG for LLMs?",
    "How do you evaluate model performance for classification?",
    "Explain embeddings and their use in search.",
    "What is overfitting and how do you prevent it?",
    "How do you design an ML pipeline for production?",
    "Explain precision vs recall trade-offs.",
    "What are transformers and why are they important?",
    "How do you handle imbalanced datasets?",
    "Explain MLOps and model versioning.",
  ],
};


export function buildFallbackQuestions(
  config: InterviewConfig,
  count: number
): { questions: Array<Record<string, unknown>> } {
  const selectedTopics = config.topics ?? [];
  const role = config.jobRole || "Software Engineer";
  const company = config.company || config.customCompany || "the company";
  const stack = config.techStack.join(", ");

  if (selectedTopics.length > 0) {
    const plan: { name: string; difficulty: string }[] = [];
    for (const topic of selectedTopics) {
      const n = Math.max(1, topic.questionCount || 1);
      for (let i = 0; i < n; i++) {
        plan.push({
          name: topic.name,
          difficulty:
            topic.difficulty === "mixed" ? config.difficulty : topic.difficulty,
        });
      }
    }
    while (plan.length < count) {
      const t = selectedTopics[plan.length % selectedTopics.length];
      plan.push({
        name: t.name,
        difficulty:
          t.difficulty === "mixed" ? config.difficulty : t.difficulty,
      });
    }
    const sliced = plan.slice(0, count);

    return {
      questions: sliced.map((item, i) => ({
        content: buildTopicFallbackQuestion(item.name, config.type, role, company, stack),
        type: config.type,
        topic: item.name,
        difficulty: item.difficulty,
        hints: [
          `Focus on ${item.name}. Structure your answer with a clear definition and a practical example.`,
        ],
        idealAnswerOutline: [
          `Define ${item.name}`,
          "Explain how it works",
          "Give a practical example",
          "Mention trade-offs or best practices",
        ],
        codingProblem: null,
        orderHint: i + 1,
      })),
    };
  }

  let pool = QUESTION_BANK[config.type];

  if (!pool && config.type === "custom" && config.techStack.length > 0) {
    pool = config.techStack.flatMap(
      (tech) => QUESTION_BANK[tech.toLowerCase().replace(/[^a-z]/g, "")] ?? []
    );
  }

  if (!pool) {
    pool =
      QUESTION_BANK[config.type.split("_")[0]] ??
      INTERVIEW_TYPE_PROFILES[config.type]?.exampleTopics.map(
        (t) => `Discuss ${t} in the context of ${config.jobRole || "this role"}.`
      ) ??
      QUESTION_BANK.technical;
  }

  const questions = Array.from({ length: count }, (_, i) => {
    const base = pool[i % pool.length];
    const content = base
      .replace(/our company/gi, company)
      .replace(/this role/gi, role)
      .concat(stack ? ` (Focus on: ${stack})` : "");

    return {
      content,
      type: config.type,
      topic: config.type,
      difficulty: config.difficulty,
      hints: ["Structure your answer with specific examples from your experience."],
      idealAnswerOutline: INTERVIEW_TYPE_PROFILES[config.type]?.exampleTopics.slice(0, 3) ?? [],
      codingProblem: null,
    };
  });

  return { questions };
}

function buildTopicFallbackQuestion(
  topic: string,
  type: string,
  role: string,
  company: string,
  stack: string
): string {
  const stackHint = stack ? ` in ${stack}` : "";
  void type;
  const templates = [
    `Explain ${topic} and give a practical use case relevant to a ${role} role${stackHint}.`,
    `What is ${topic}? Walk me through how you would apply it in a real project at ${company}.`,
    `Describe common mistakes developers make with ${topic}, and how you avoid them.`,
    `How does ${topic} work under the hood, and when would you choose an alternative approach?`,
    `Give a concise interview-ready explanation of ${topic}, including one concrete example.`,
  ];
  const hash = topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

export function buildFallbackCoachAnalysis(
  question: string,
  answer: string,
  nextQuestionContent?: string | null,
  isLastQuestion?: boolean
): AnswerAnalysis {
  const base = buildHeuristicAnswerAnalysis(question, answer);
  const scoreOutOf10 = Math.round((base.score ?? 50) / 10);
  const isWeak = scoreOutOf10 < 6;

  const coachingTips =
    scoreOutOf10 < 6
      ? [
          "Your answer needs more depth — mention specific concepts related to the question.",
          "Add a real example from a project to demonstrate practical experience.",
        ]
      : scoreOutOf10 < 8
        ? ["Good foundation — add more technical detail and trade-offs."]
        : ["Strong answer — consider discussing edge cases or advanced scenarios."];

  const interviewerResponse = isLastQuestion
    ? `${coachingTips[0]} That concludes our interview. You scored ${scoreOutOf10}/10 on this question.`
    : isWeak
      ? `${coachingTips[0]} Let me probe deeper: can you elaborate on the core concepts in this question?`
      : nextQuestionContent
        ? `${coachingTips[0]} Score: ${scoreOutOf10}/10. Let's move on. ${nextQuestionContent}`
        : `${coachingTips[0]} Score: ${scoreOutOf10}/10. Let's continue.`;

  return {
    ...base,
    scoreOutOf10,
    scorePercent: base.score,
    correctness: isWeak ? "Partially correct or incomplete" : "Generally correct",
    technicalAccuracy: isWeak ? "Needs more technical depth" : "Adequate technical coverage",
    completeness: isWeak ? "Missing key points" : "Covers main points",
    communicationQuality: "Clear enough to evaluate",
    confidence: "Moderate",
    missingPoints: isWeak ? ["Key concepts from the question topic"] : [],
    incorrectStatements: [],
    idealAnswerKeyPoints: ["Define the concept", "Explain with example", "Mention trade-offs"],
    bestPractices: ["Use structured answers", "Include real project examples"],
    commonMistakes: ["Being too vague", "Skipping examples"],
    interviewerExpectations: "Interviewers expect specific concepts with practical examples.",
    coachingTips,
    betterAnswer: base.betterVersion,
    followUpType: isWeak ? "clarification" : "next_question",
    followUpQuestion: isWeak ? "Can you elaborate on the key concepts?" : null,
    shouldAdvanceQuestion: !isWeak,
    interviewerResponse,
    topicTag: "general",
  };
}

/** @deprecated Use buildFallbackCoachAnalysis */
export function buildFallbackInterviewerResponse(
  userAnswer: string,
  nextQuestionContent?: string | null,
  isLastQuestion?: boolean
): string {
  const acknowledgment =
    userAnswer.length > 80
      ? "Thank you for that detailed response."
      : "Thank you for your answer.";

  if (isLastQuestion) {
    return `${acknowledgment} That wraps up our questions for today. Well done.`;
  }

  if (nextQuestionContent) {
    return `${acknowledgment} Let's continue. ${nextQuestionContent}`;
  }

  return `${acknowledgment} Let's move on to the next question.`;
}

export function buildHeuristicAnswerAnalysis(
  question: string,
  answer: string,
  config?: InterviewConfig
): AnswerAnalysis {
  const defaultConfig: InterviewConfig = config ?? {
    type: "technical",
    difficulty: "medium",
    techStack: [],
    duration: 30,
    questionCount: 5,
    language: "en",
    mode: "text",
    cameraEnabled: false,
    hintsEnabled: false,
  };

  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasExamples =
    /for example|for instance|when i|in my|project|team/i.test(answer);
  const score = Math.min(
    95,
    Math.max(35, Math.round(words * 1.2 + (hasExamples ? 20 : 0)))
  );

  const idealAnswer = buildFallbackIdealAnswer(question, defaultConfig);
  const practiceAnswer = buildFallbackPracticeVersion(
    idealAnswer,
    question,
    defaultConfig
  );

  return {
    score,
    isGood: score >= 65,
    whyGood: hasExamples
      ? ["Provided concrete examples", "Answered the question directly"]
      : ["Attempted the question"],
    whyWeak: words < 25 ? ["Answer could be more detailed"] : [],
    betterVersion: practiceAnswer,
    industryAnswer: idealAnswer,
    recruiterView:
      score >= 65
        ? "Solid response worth exploring further in a follow-up."
        : "Response needs more depth and specific examples.",
    weakPoints: words < 25 ? ["Insufficient detail"] : [],
    strongPoints: hasExamples ? ["Used real examples"] : ["Clear communication"],
  };
}

export function buildFallbackFeedback(
  transcript: { question: string; answer: string; score?: number; analysis?: AnswerAnalysis }[],
  config: InterviewConfig,
  recurringWeakTopics: string[] = []
): InterviewReportData {
  const scores = transcript.map((t) => t.score ?? heuristicScore(t.answer));
  const avg =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 60;

  const shortAnswers = transcript.filter(
    (t) => t.answer.trim().split(/\s+/).length < 20
  ).length;

  const weakTopics = [
    ...new Set([
      ...transcript.flatMap((t) => (t.analysis?.topicTag ? [t.analysis.topicTag] : [])),
      ...(shortAnswers > 0 ? [`${config.type} depth`] : []),
      ...recurringWeakTopics,
    ]),
  ].slice(0, 8);

  const strongTopics = transcript
    .filter((t) => (t.score ?? 0) >= 70)
    .map((t) => t.analysis?.topicTag ?? t.question.slice(0, 40))
    .filter(Boolean)
    .slice(0, 5);

  return {
    overallScore: Math.round(avg),
    communicationScore: Math.round(avg + (shortAnswers > 0 ? -5 : 5)),
    confidenceScore: Math.round(avg),
    technicalScore: Math.round(avg),
    problemSolvingScore: Math.round(avg - 3),
    behaviorScore: Math.round(avg),
    weakAreas:
      shortAnswers > 0
        ? ["Provide more detailed answers with specific examples"]
        : ["Continue practicing structured responses"],
    strongAreas: strongTopics.length
      ? strongTopics.map(String)
      : ["Completed the full interview", "Engaged with all questions"],
    suggestions: [
      "Use the STAR method for behavioral questions.",
      `Review core topics for ${config.type.replace(/_/g, " ")} interviews.`,
      ...recurringWeakTopics.slice(0, 2).map((t) => `Practice more: ${t}`),
    ],
    detailedExplanation: `You completed a ${config.type.replace(/_/g, " ")} interview with ${transcript.length} questions. Average score: ${Math.round(avg)}%. ${recurringWeakTopics.length ? `Recurring weak areas: ${recurringWeakTopics.join(", ")}.` : ""} Focus on specific examples and measurable outcomes.`,
    strongTopics: strongTopics.map(String),
    weakTopics,
    mistakesMade: transcript
      .filter((t) => (t.score ?? 100) < 60)
      .map((t) => t.analysis?.incorrectStatements?.[0] ?? `Weak answer on: ${t.question.slice(0, 60)}`)
      .slice(0, 5),
    questionsAnsweredWell: transcript
      .filter((t) => (t.score ?? 0) >= 75)
      .map((t) => ({ question: t.question, score: t.score ?? 0 })),
    questionsAnsweredPoorly: transcript
      .filter((t) => (t.score ?? 100) < 60)
      .map((t) => ({
        question: t.question,
        score: t.score ?? 0,
        issue: t.analysis?.missingPoints?.[0] ?? "Insufficient depth",
      })),
    recommendedStudyTopics: weakTopics,
    improvementRoadmap: weakTopics.slice(0, 3).map((topic, i) => ({
      topic,
      priority: (i === 0 ? "high" : "medium") as "high" | "medium",
      actions: [`Study ${topic}`, `Practice explaining ${topic} with examples`],
    })),
    recurringPatterns: recurringWeakTopics.length
      ? [`Struggled with: ${recurringWeakTopics.join(", ")}`]
      : shortAnswers > 0
        ? ["Answers tend to be too brief"]
        : [],
  };
}

export function heuristicScore(answer: string): number {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words < 8) return 40;
  if (words < 25) return 58;
  if (words < 60) return 72;
  return 85;
}

export function buildFallbackJobMatch(
  resumeText: string,
  jobDescription: string
): JobMatchResult {
  const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/).filter(Boolean));
  const jdWords = jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const uniqueJd = [...new Set(jdWords)];
  const matched = uniqueJd.filter((w) => resumeWords.has(w)).slice(0, 15);
  const missing = uniqueJd.filter((w) => !resumeWords.has(w)).slice(0, 10);
  const matchScore = uniqueJd.length
    ? Math.round((matched.length / Math.max(1, uniqueJd.length)) * 100)
    : 50;
  const density = Math.round(
    (matched.length / Math.max(1, uniqueJd.length)) * 100
  );

  return {
    matchScore: Math.min(95, Math.max(25, matchScore)),
    missingSkills: missing.slice(0, 8),
    matchingSkills: matched.slice(0, 10),
    keywordAnalysis: {
      matched,
      missing,
      density,
    },
    atsImprovements: [
      "Mirror exact skill phrases from the job description where truthful.",
      "Quantify achievements with metrics where possible.",
      "Use a clean single-column layout so ATS parsers read sections in order.",
    ],
    suggestions: [
      "Tailor your resume summary to mirror the role requirements.",
      "Add projects that demonstrate missing skills.",
      "Reorder bullet points so the most JD-relevant impact comes first.",
    ],
    interviewQuestions: [
      "Why are you interested in this role?",
      "Describe experience relevant to the job requirements.",
      "How do your skills match this position?",
    ],
    sectionRecommendations: [
      {
        section: "Skills",
        recommendation: "Add missing JD skills you can honestly claim.",
      },
      {
        section: "Experience",
        recommendation: "Rewrite bullets to echo priority JD responsibilities.",
      },
      {
        section: "Summary",
        recommendation: "Open with the target role title and 2–3 matching strengths.",
      },
    ],
  };
}

export function buildFallbackResumeAnalysis(resumeText: string): ResumeAnalysis {
  const words = resumeText.trim().split(/\s+/).filter(Boolean);
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);
  const skillKeywords = [
    "javascript",
    "typescript",
    "python",
    "react",
    "node",
    "java",
    "sql",
    "aws",
    "docker",
    "kubernetes",
    "rest",
    "api",
    "mongodb",
    "postgresql",
    "git",
    "ci/cd",
  ];
  const lower = resumeText.toLowerCase();
  const detectedSkills = skillKeywords.filter((s) => lower.includes(s));
  const missingSkills = skillKeywords.filter((s) => !lower.includes(s)).slice(0, 6);
  const overall = Math.min(85, Math.max(42, Math.round(words.length / 12)));
  const hasProjects = /project/i.test(resumeText);
  const hasEducation = /university|college|bachelor|master|b\.?s\.?|m\.?s\.?/i.test(
    resumeText
  );
  const emailMatch = resumeText.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  const githubMatch = resumeText.match(/github\.com\/[A-Za-z0-9_-]+/i);
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i);

  const suggestions = [
    "Add measurable achievements (%, time saved, users served) to each role.",
    "Include relevant technical keywords for your target role when truthful.",
    "Keep formatting simple (standard headings, no tables/columns) for ATS compatibility.",
    "Rewrite weak bullets with action verbs: Built, Led, Reduced, Shipped.",
    hasProjects
      ? "Expand project descriptions with impact and tech stack."
      : "Add 1–2 projects that prove your strongest skills.",
  ];

  return {
    fullName: lines[0]?.length < 60 ? lines[0] : undefined,
    professionalTitle: lines.find((l) =>
      /engineer|developer|designer|manager|analyst/i.test(l)
    ),
    summary: lines.find((l) => /summary|objective/i.test(l))
      ? lines.slice(0, 4).join(" ")
      : undefined,
    contact: {
      email: emailMatch?.[0],
      github: githubMatch?.[0],
      linkedin: linkedinMatch?.[0],
    },
    skills:
      detectedSkills.length > 0
        ? detectedSkills
        : ["Communication", "Problem Solving"],
    technicalSkills: detectedSkills,
    softSkills: ["Communication", "Problem Solving"].filter((s) =>
      lower.includes(s.toLowerCase())
    ),
    certifications: lines
      .filter((l) => /certif|aws certified|coursera|udemy/i.test(l))
      .slice(0, 5),
    languages: [],
    achievements: lines
      .filter((l) => /\d+%|\d+\+|increased|reduced|improved/i.test(l))
      .slice(0, 5),
    projects: [
      {
        name: "Projects from resume",
        description:
          lines.find((l) => /project/i.test(l)) ??
          "Review projects section for details",
        technologies: detectedSkills.slice(0, 4),
      },
    ],
    education: [
      {
        institution:
          lines.find((l) => /university|college/i.test(l)) ?? "See resume",
        degree:
          lines.find((l) => /b\.?s\.?|m\.?s\.?|degree|bachelor|master/i.test(l)) ??
          "Not specified",
        year: "",
      },
    ],
    experience: [
      {
        company: "See resume",
        role: "Professional experience",
        duration: "",
        highlights: lines
          .filter((l) => /experience|worked|engineer|developer|led|built/i.test(l))
          .slice(0, 4),
      },
    ],
    strengths: [
      "Resume uploaded and text extracted successfully",
      detectedSkills.length > 3
        ? "Multiple technical skills detected"
        : "Baseline content available for interview practice",
    ],
    weaknesses: [
      words.length < 100
        ? "Resume text is short — add more detail"
        : "Deeper AI analysis was unavailable; scores are heuristic",
      missingSkills.length
        ? "Some common stack keywords are missing"
        : "Expand quantified achievements",
    ],
    atsScore: overall,
    scores: {
      overall,
      strength: overall,
      formatting: words.length > 80 ? 68 : 48,
      keywordMatch: Math.min(90, 40 + detectedSkills.length * 5),
      skills: Math.min(92, 38 + detectedSkills.length * 6),
      experience: /experience|engineer|developer|intern/i.test(resumeText)
        ? 68
        : 40,
      education: hasEducation ? 72 : 45,
      projects: hasProjects ? 70 : 40,
      readability: words.length > 120 && words.length < 1100 ? 74 : 55,
    },
    sectionFeedback: {
      summary: {
        status: /summary|objective/i.test(resumeText) ? "adequate" : "missing",
        strengths: /summary|objective/i.test(resumeText)
          ? ["Summary section detected"]
          : [],
        weaknesses: /summary|objective/i.test(resumeText)
          ? ["May lack role-specific keywords"]
          : ["No clear professional summary"],
        missing: ["Target role title", "2–3 proof points"],
        improvements: [
          "Write a 3–4 line summary with role title + core stack + impact.",
        ],
      },
      skills: {
        status: detectedSkills.length > 4 ? "strong" : "weak",
        strengths:
          detectedSkills.length > 0
            ? [`Detected: ${detectedSkills.slice(0, 5).join(", ")}`]
            : [],
        weaknesses: ["Skills may not be grouped for ATS scanning"],
        missing: missingSkills,
        improvements: [
          "List technical skills in a dedicated plain-text Skills section.",
        ],
      },
      experience: {
        status: /experience|engineer|developer/i.test(resumeText)
          ? "adequate"
          : "weak",
        strengths: ["Experience content detected"],
        weaknesses: ["Bullets may lack metrics"],
        missing: ["Quantified outcomes"],
        improvements: [
          "Start bullets with action verbs and add measurable results.",
        ],
      },
      projects: {
        status: hasProjects ? "adequate" : "missing",
        strengths: hasProjects ? ["Projects mentioned"] : [],
        weaknesses: hasProjects
          ? ["May need clearer tech + impact"]
          : ["No projects section found"],
        missing: hasProjects ? ["Impact metrics"] : ["Project section"],
        improvements: [
          "Describe problem → approach → result and list technologies used.",
        ],
      },
      education: {
        status: hasEducation ? "adequate" : "weak",
        strengths: hasEducation ? ["Education signals found"] : [],
        weaknesses: hasEducation ? [] : ["Education details unclear"],
        missing: hasEducation ? [] : ["Degree", "Institution", "Year"],
        improvements: ["Include degree, school, and graduation year clearly."],
      },
      certifications: {
        status: /certif/i.test(resumeText) ? "adequate" : "missing",
        strengths: /certif/i.test(resumeText)
          ? ["Certification mentions found"]
          : [],
        weaknesses: /certif/i.test(resumeText)
          ? []
          : ["No certifications listed"],
        missing: /certif/i.test(resumeText) ? [] : ["Relevant certifications"],
        improvements: [
          "Add role-relevant certifications only if earned (e.g. AWS, Google).",
        ],
      },
    },
    keywordAnalysis: {
      strong: detectedSkills.slice(0, 8),
      weak: detectedSkills.slice(0, 2),
      missing: missingSkills,
      suggested: missingSkills,
    },
    missingSkills,
    suggestions,
    improvementSuggestions: suggestions.map((detail, i) => ({
      title: detail.slice(0, 60),
      detail,
      whyItHelpsAts:
        i === 2
          ? "Simple layouts parse reliably; complex tables often scramble section order."
          : "Clear keywords and quantified impact improve both ATS ranking and recruiter skim time.",
      priority: (i < 2 ? "high" : "medium") as "high" | "medium",
    })),
    actionPlan: [
      "Fix formatting for ATS (standard headings, single column).",
      "Add missing truthful keywords from your target role.",
      "Quantify at least 3 experience/project bullets.",
      "Rewrite summary for the target job title.",
    ],
    rewrites: {
      professionalSummary:
        "Results-driven professional seeking opportunities to apply technical skills, deliver measurable impact, and grow in a collaborative engineering environment.",
      experienceBullets: [
        "Delivered features and improvements across the stack, collaborating with teammates to ship reliable releases.",
        "Improved system quality through testing, debugging, and iterative enhancements.",
      ],
      projectDescriptions: [
        "Built a project using modern web technologies; documented architecture and demonstrated end-to-end functionality.",
      ],
      skillsSection: [
        `Technical: ${detectedSkills.join(", ") || "List your core stack here"}`,
        "Soft skills: Communication, Problem Solving, Collaboration",
      ],
    },
  };
}

export function buildFallbackAnswerCoaching(
  question: string,
  answer: string,
  config: InterviewConfig,
  liveAnalysis?: AnswerAnalysis | null
): AnswerCoaching {
  const base = liveAnalysis ?? buildHeuristicAnswerAnalysis(question, answer, config);
  const scoreOutOf10 = base.scoreOutOf10 ?? Math.round((base.score ?? 50) / 10);
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const isWeak = scoreOutOf10 < 6;

  const idealAnswer = ensureValidIdealAnswer(
    base.industryAnswer || "",
    question,
    config
  );
  const practiceVersion = ensureValidPracticeVersion(
    base.betterVersion || base.betterAnswer || "",
    idealAnswer,
    question,
    config
  );

  const missedConcepts =
    base.missingPoints ?? (isWeak ? ["Core concepts for this topic"] : []);
  const weakExplanations =
    base.weaknesses ?? base.weakPoints ?? (isWeak ? ["Explanation lacked depth and examples"] : []);

  return {
    question,
    answer,
    scoreOutOf10,
    technicalAccuracy: base.technicalAccuracy ?? (isWeak ? "Needs more technical depth" : "Adequate coverage"),
    communication: base.communicationQuality ?? (words < 25 ? "Answer was brief — expand with structure" : "Clear enough to follow"),
    confidence: base.confidence ?? (words < 15 ? "Low — very short answer" : "Moderate confidence"),
    completeness: base.completeness ?? (isWeak ? "Missing key aspects" : "Covers main points"),
    clarity: base.communicationQuality ?? "Could be more structured with a clear opening and examples",
    whatYouDidWell: base.strengths ?? base.strongPoints ?? (words > 30 ? ["Engaged with the question", "Provided a substantive attempt"] : ["Attempted the question"]),
    whatYouMissed: {
      incorrectStatements: base.incorrectStatements ?? [],
      missingConcepts: missedConcepts,
      missingKeywords: isWeak ? [`Keywords relevant to ${config.type.replace(/_/g, " ")}`] : [],
      weakExplanations,
      missingTechnicalDetails: base.missingPoints ?? [],
      communicationProblems:
        words < 20
          ? ["Answer was too brief — expand with structure (intro → explanation → example)"]
          : words > 200
            ? ["Consider tightening — aim for focused, structured delivery"]
            : [],
      whyItMatters:
        isWeak
          ? `Interviewers for ${config.jobRole || "this role"} expect specific technical depth and real examples. Missing these points signals incomplete preparation.`
          : "Minor gaps won't disqualify you, but adding more precision would strengthen your candidacy.",
    },
    idealInterviewAnswer: idealAnswer,
    whyStrongAnswer: `This answer works because it leads with a clear definition, demonstrates hands-on experience relevant to ${config.jobRole || "the role"}, uses expected keywords for ${config.type.replace(/_/g, " ")} interviews, and shows structured thinking (concept → example → trade-off) that senior interviewers look for.`,
    comparison: {
      whatMissed: missedConcepts.length > 0 ? missedConcepts : (isWeak ? ["Key technical concepts expected for this question"] : []),
      whatToImprove: weakExplanations,
      pointsToAdd: [
        ...(base.idealAnswerKeyPoints ?? []).slice(0, 3),
        ...(config.techStack[0] ? [`Mention practical experience with ${config.techStack[0]}`] : []),
      ],
      partsToRemoveOrSimplify:
        words > 150
          ? ["Trim filler and repetition — keep the core technical points"]
          : answer.trim().length === 0
            ? ["Start with a direct answer instead of hedging"]
            : [],
    },
    practiceVersion,
    interviewTips: base.coachingTips ?? base.bestPractices ?? [
      "Use a clear structure: definition → example → trade-off",
      `Mention technologies from your stack: ${config.techStack.join(", ") || config.type}`,
      "Quantify impact when possible",
    ],
    difficultyLevel: config.difficulty === "easy" || config.difficulty === "medium" ? "medium" : "hard",
    difficultyExplanation: `This is a standard ${config.type.replace(/_/g, " ")} question at ${config.difficulty} difficulty for ${config.experienceLevel || "mid-level"} candidates.`,
    recommendedPractice: [
      ...(base.topicTag ? [`Review: ${base.topicTag}`] : []),
      `Practice explaining ${config.type.replace(/_/g, " ")} topics with STAR-style examples`,
      ...(config.techStack.slice(0, 2).map((t) => `Deep dive: ${t}`)),
    ],
    topicTag: base.topicTag ?? config.type,
  };
}

export function buildFallbackPostInterviewCoaching(
  items: { question: string; answer: string; analysis?: AnswerAnalysis | null }[],
  config: InterviewConfig
): AnswerCoaching[] {
  return items.map((item) =>
    buildFallbackAnswerCoaching(item.question, item.answer, config, item.analysis)
  );
}

export function isRecoverableAiError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "isRateLimited" in error &&
    (error as { isRateLimited: boolean }).isRateLimited
  ) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("503") ||
      msg.includes("unavailable")
    );
  }
  return false;
}
