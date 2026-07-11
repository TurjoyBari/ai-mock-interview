import type { InterviewConfig } from "@/types";

export interface InterviewTypeProfile {
  label: string;
  category: "hr" | "behavioral" | "technical" | "coding" | "system_design";
  allowedTopics: string[];
  forbiddenTopics: string[];
  questionFocus: string;
  evaluationCriteria: string[];
  exampleTopics: string[];
}

export const INTERVIEW_TYPE_PROFILES: Record<string, InterviewTypeProfile> = {
  hr: {
    label: "HR Interview",
    category: "hr",
    allowedTopics: [
      "motivation",
      "career goals",
      "culture fit",
      "compensation",
      "notice period",
      "teamwork",
      "conflict resolution",
      "why this company",
      "strengths and weaknesses",
    ],
    forbiddenTopics: [
      "coding",
      "algorithms",
      "system design",
      "database internals",
      "framework APIs",
    ],
    questionFocus:
      "Ask HR screening questions only: motivation, culture fit, career goals, compensation expectations, notice period, relocation, and situational judgment. No technical or coding questions.",
    evaluationCriteria: [
      "Professionalism and clarity",
      "Alignment with role and company",
      "Self-awareness",
      "Honesty and authenticity",
      "Communication confidence",
    ],
    exampleTopics: [
      "Tell me about yourself",
      "Why this company",
      "Salary expectations",
      "Career goals in 5 years",
    ],
  },
  behavioral: {
    label: "Behavioral Interview",
    category: "behavioral",
    allowedTopics: [
      "leadership",
      "conflict",
      "failure",
      "teamwork",
      "STAR stories",
      "prioritization",
      "influence",
      "initiative",
      "feedback",
    ],
    forbiddenTopics: [
      "coding syntax",
      "algorithm complexity",
      "low-level system design",
      "framework-specific APIs unless mentioned in stack",
    ],
    questionFocus:
      "Ask behavioral questions requiring STAR-format stories. Probe for Situation, Task, Action, Result. Focus on past behavior, not hypotheticals.",
    evaluationCriteria: [
      "STAR structure completeness",
      "Specificity and metrics",
      "Ownership and impact",
      "Reflection and learning",
      "Communication clarity",
    ],
    exampleTopics: [
      "Leadership example",
      "Conflict with teammate",
      "Failure and learning",
      "Going above and beyond",
    ],
  },
  technical: {
    label: "Technical Interview",
    category: "technical",
    allowedTopics: [
      "fundamentals",
      "networking",
      "databases",
      "APIs",
      "OOP",
      "concurrency",
      "testing",
      "debugging",
      "trade-offs",
    ],
    forbiddenTopics: [
      "salary negotiation",
      "HR policy",
      "pure behavioral without technical angle",
    ],
    questionFocus:
      "Ask broad software engineering fundamentals appropriate to role and experience level. Include trade-offs, debugging, and real-world scenarios.",
    evaluationCriteria: [
      "Technical correctness",
      "Depth of understanding",
      "Trade-off awareness",
      "Practical experience",
      "Clear explanations",
    ],
    exampleTopics: [
      "HTTP vs HTTPS",
      "SQL vs NoSQL",
      "Caching strategies",
      "Debugging production issues",
    ],
  },
  coding: {
    label: "Coding Interview",
    category: "coding",
    allowedTopics: [
      "algorithms",
      "data structures",
      "time complexity",
      "space complexity",
      "edge cases",
      "problem decomposition",
      "clean code",
    ],
    forbiddenTopics: [
      "HR questions",
      "salary",
      "behavioral-only stories without coding",
      "system design at scale",
    ],
    questionFocus:
      "Present coding problems with clear constraints. Expect approach explanation, complexity analysis, and edge case handling before or after implementation.",
    evaluationCriteria: [
      "Algorithm correctness",
      "Time/space complexity",
      "Edge case handling",
      "Code clarity",
      "Problem-solving approach",
    ],
    exampleTopics: [
      "Arrays and hash maps",
      "Trees and graphs",
      "Two pointers",
      "Dynamic programming",
    ],
  },
  system_design: {
    label: "System Design Interview",
    category: "system_design",
    allowedTopics: [
      "scalability",
      "availability",
      "consistency",
      "caching",
      "load balancing",
      "databases",
      "queues",
      "API design",
      "capacity estimation",
    ],
    forbiddenTopics: [
      "HR questions",
      "leetcode-style micro puzzles",
      "salary",
    ],
    questionFocus:
      "Ask system design scenarios. Expect requirements clarification, high-level architecture, component deep-dives, bottlenecks, and trade-offs.",
    evaluationCriteria: [
      "Requirements gathering",
      "Architecture clarity",
      "Scalability thinking",
      "Trade-off analysis",
      "Operational awareness",
    ],
    exampleTopics: [
      "Design a URL shortener",
      "Design a chat system",
      "Design a news feed",
      "Design rate limiting",
    ],
  },
  frontend: {
    label: "Frontend Interview",
    category: "technical",
    allowedTopics: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Vue",
      "Angular",
      "accessibility",
      "performance",
      "browser rendering",
      "responsive design",
      "state management",
      "Web APIs",
    ],
    forbiddenTopics: [
      "backend-only topics unless fullstack context",
      "HR questions",
      "database administration",
      "DevOps infrastructure",
    ],
    questionFocus:
      "Ask frontend-specific questions: DOM, CSS layout, JS event loop, component architecture, performance, accessibility, and browser behavior.",
    evaluationCriteria: [
      "UI/UX technical knowledge",
      "Browser fundamentals",
      "Component design",
      "Performance optimization",
      "Accessibility awareness",
    ],
    exampleTopics: [
      "CSS specificity and layout",
      "React reconciliation",
      "Browser rendering pipeline",
      "Frontend performance",
    ],
  },
  backend: {
    label: "Backend Interview",
    category: "technical",
    allowedTopics: [
      "APIs",
      "REST",
      "GraphQL",
      "databases",
      "caching",
      "authentication",
      "microservices",
      "message queues",
      "concurrency",
      "ORM",
      "server architecture",
    ],
    forbiddenTopics: [
      "CSS layout",
      "React hooks",
      "HR questions",
      "UI component design",
    ],
    questionFocus:
      "Ask backend engineering questions: API design, databases, auth, scalability, data modeling, and service architecture.",
    evaluationCriteria: [
      "API and data modeling",
      "Security awareness",
      "Scalability",
      "Database knowledge",
      "Error handling and reliability",
    ],
    exampleTopics: [
      "REST vs GraphQL",
      "Database indexing",
      "JWT vs sessions",
      "Idempotency in APIs",
    ],
  },
  fullstack: {
    label: "Full Stack Interview",
    category: "technical",
    allowedTopics: [
      "frontend",
      "backend",
      "databases",
      "APIs",
      "deployment",
      "authentication",
      "state management",
      "end-to-end architecture",
    ],
    forbiddenTopics: ["HR-only questions", "salary", "pure algorithm contests"],
    questionFocus:
      "Balance frontend and backend questions. Cover full request lifecycle, data flow, auth, and deployment across the stack.",
    evaluationCriteria: [
      "End-to-end thinking",
      "Frontend and backend integration",
      "Data flow clarity",
      "Practical fullstack experience",
      "Trade-offs across layers",
    ],
    exampleTopics: [
      "Auth flow front to back",
      "SSR vs CSR trade-offs",
      "API design for SPA",
      "Database choice for product",
    ],
  },
  database: {
    label: "Database Interview",
    category: "technical",
    allowedTopics: [
      "SQL",
      "indexes",
      "normalization",
      "transactions",
      "ACID",
      "query optimization",
      "joins",
      "NoSQL",
      "replication",
      "sharding",
      "schema design",
    ],
    forbiddenTopics: [
      "React",
      "CSS",
      "HR questions",
      "frontend frameworks",
    ],
    questionFocus:
      "Ask database-specific questions: SQL, indexing, transactions, schema design, query optimization, and distributed data concerns.",
    evaluationCriteria: [
      "SQL proficiency",
      "Schema design",
      "Index and query optimization",
      "Transaction understanding",
      "Data modeling",
    ],
    exampleTopics: [
      "Index types and when to use them",
      "ACID properties",
      "JOIN types",
      "Normalization vs denormalization",
    ],
  },
  javascript: {
    label: "JavaScript Interview",
    category: "technical",
    allowedTopics: [
      "closures",
      "hoisting",
      "event loop",
      "promises",
      "async/await",
      "prototypes",
      "this keyword",
      "ES6+",
      "type coercion",
      "modules",
    ],
    forbiddenTopics: [
      "React-specific unless in stack",
      "Python",
      "Java",
      "HR questions",
      ".NET",
    ],
    questionFocus:
      "Ask JavaScript language fundamentals only: closures, prototypes, event loop, async, scope, and ES6+ features.",
    evaluationCriteria: [
      "Language fundamentals",
      "Async understanding",
      "Scope and closures",
      "Prototype chain",
      "Practical JS patterns",
    ],
    exampleTopics: [
      "Explain the event loop",
      "Closure use cases",
      "Promise vs async/await",
      "this binding rules",
    ],
  },
  react: {
    label: "React Interview",
    category: "technical",
    allowedTopics: [
      "hooks",
      "useState",
      "useEffect",
      "useMemo",
      "useCallback",
      "reconciliation",
      "virtual DOM",
      "context",
      "state management",
      "React 18",
      "Server Components",
      "performance",
      "testing",
    ],
    forbiddenTopics: [
      "Node.js server internals unless fullstack",
      "Python",
      "HR questions",
      "database administration",
      "Java Spring",
    ],
    questionFocus:
      "Ask React-specific questions ONLY: hooks, rendering, reconciliation, state management, performance, and component patterns. Never ask HR or unrelated backend questions.",
    evaluationCriteria: [
      "Hooks mastery",
      "Rendering and reconciliation",
      "State management patterns",
      "Performance optimization",
      "Component design",
    ],
    exampleTopics: [
      "useEffect cleanup and dependencies",
      "React reconciliation",
      "useMemo vs useCallback",
      "Context vs external state",
    ],
  },
  nextjs: {
    label: "Next.js Interview",
    category: "technical",
    allowedTopics: [
      "App Router",
      "Pages Router",
      "SSR",
      "SSG",
      "ISR",
      "Server Components",
      "Client Components",
      "API routes",
      "middleware",
      "caching",
      "data fetching",
      "deployment",
    ],
    forbiddenTopics: [
      "Python Django",
      "Java Spring",
      "HR questions",
      "unrelated mobile dev",
    ],
    questionFocus:
      "Ask Next.js-specific questions: App Router, rendering strategies, Server/Client Components, caching, middleware, and deployment.",
    evaluationCriteria: [
      "Next.js architecture",
      "Rendering strategy choice",
      "Data fetching patterns",
      "Caching understanding",
      "Production deployment",
    ],
    exampleTopics: [
      "SSR vs SSG vs ISR",
      "Server vs Client Components",
      "Next.js caching layers",
      "Middleware use cases",
    ],
  },
  nodejs: {
    label: "Node.js Interview",
    category: "technical",
    allowedTopics: [
      "event loop",
      "streams",
      "Express",
      "Fastify",
      "async I/O",
      "clustering",
      "worker threads",
      "npm",
      "middleware",
      "error handling",
      "security",
    ],
    forbiddenTopics: [
      "React hooks",
      "CSS",
      "HR questions",
      "Python asyncio",
      ".NET",
    ],
    questionFocus:
      "Ask Node.js runtime and backend questions: event loop, streams, frameworks, async patterns, and production concerns.",
    evaluationCriteria: [
      "Event loop understanding",
      "Async patterns",
      "Stream and buffer handling",
      "Framework knowledge",
      "Production reliability",
    ],
    exampleTopics: [
      "Node event loop phases",
      "Streams vs buffers",
      "Error handling in Express",
      "Clustering vs worker threads",
    ],
  },
  typescript: {
    label: "TypeScript Interview",
    category: "technical",
    allowedTopics: [
      "types",
      "generics",
      "utility types",
      "type guards",
      "interfaces vs types",
      "enums",
      "conditional types",
      "mapped types",
      "strict mode",
      "inference",
    ],
    forbiddenTopics: [
      "HR questions",
      "Python typing",
      "Java generics only",
      "CSS",
    ],
    questionFocus:
      "Ask TypeScript type system questions: generics, utility types, type narrowing, strict mode, and advanced typing patterns.",
    evaluationCriteria: [
      "Type system mastery",
      "Generic usage",
      "Type safety practices",
      "Inference understanding",
      "Real-world TS patterns",
    ],
    exampleTopics: [
      "Generics with constraints",
      "Type guards and narrowing",
      "Utility types (Pick, Omit, Partial)",
      "interface vs type alias",
    ],
  },
  python: {
    label: "Python Interview",
    category: "technical",
    allowedTopics: [
      "GIL",
      "decorators",
      "generators",
      "list comprehensions",
      "OOP",
      "asyncio",
      "Django",
      "Flask",
      "FastAPI",
      "data structures",
      "memory management",
    ],
    forbiddenTopics: [
      "React hooks",
      "JavaScript closures",
      "HR questions",
      ".NET",
    ],
    questionFocus:
      "Ask Python language and ecosystem questions: GIL, decorators, async, frameworks, and Pythonic patterns.",
    evaluationCriteria: [
      "Python fundamentals",
      "Framework knowledge",
      "Async understanding",
      "Pythonic code style",
      "Standard library usage",
    ],
    exampleTopics: [
      "Explain the GIL",
      "Decorators and use cases",
      "Generators vs iterators",
      "asyncio patterns",
    ],
  },
  dotnet: {
    label: ".NET Interview",
    category: "technical",
    allowedTopics: [
      "C#",
      "ASP.NET Core",
      "Entity Framework",
      "LINQ",
      "async/await",
      "dependency injection",
      "middleware",
      "memory management",
      "garbage collection",
    ],
    forbiddenTopics: [
      "React hooks",
      "Python",
      "HR questions",
      "Node.js event loop",
    ],
    questionFocus:
      "Ask .NET and C# questions: ASP.NET Core, EF Core, DI, async patterns, and CLR fundamentals.",
    evaluationCriteria: [
      "C# language features",
      "ASP.NET Core architecture",
      "EF Core and data access",
      "DI patterns",
      "Async/await in .NET",
    ],
    exampleTopics: [
      "Dependency injection in ASP.NET",
      "EF Core tracking vs no-tracking",
      "async/await best practices",
      "LINQ optimization",
    ],
  },
  devops: {
    label: "DevOps Interview",
    category: "technical",
    allowedTopics: [
      "CI/CD",
      "Docker",
      "Kubernetes",
      "Terraform",
      "monitoring",
      "logging",
      "AWS",
      "Azure",
      "GCP",
      "IaC",
      "SRE",
    ],
    forbiddenTopics: ["React hooks", "HR questions", "leetcode puzzles"],
    questionFocus:
      "Ask DevOps/SRE questions: CI/CD, containers, orchestration, IaC, monitoring, and incident response.",
    evaluationCriteria: [
      "Pipeline design",
      "Container orchestration",
      "Infrastructure as code",
      "Observability",
      "Incident response",
    ],
    exampleTopics: [
      "CI/CD pipeline design",
      "Kubernetes pod lifecycle",
      "Blue-green vs canary",
      "Monitoring and alerting",
    ],
  },
  aiml: {
    label: "AI/ML Interview",
    category: "technical",
    allowedTopics: [
      "machine learning",
      "deep learning",
      "NLP",
      "LLMs",
      "training",
      "inference",
      "feature engineering",
      "model evaluation",
      "MLOps",
      "embeddings",
    ],
    forbiddenTopics: ["HR questions", "CSS", "React styling"],
    questionFocus:
      "Ask AI/ML questions: model training, evaluation, LLMs, embeddings, and production ML systems.",
    evaluationCriteria: [
      "ML fundamentals",
      "Model evaluation",
      "LLM understanding",
      "Production ML awareness",
      "Ethics and safety",
    ],
    exampleTopics: [
      "Bias-variance tradeoff",
      "Fine-tuning vs RAG",
      "Model evaluation metrics",
      "MLOps pipeline",
    ],
  },
  custom: {
    label: "Custom Interview",
    category: "technical",
    allowedTopics: ["user-defined based on tech stack and role"],
    forbiddenTopics: ["off-topic questions unrelated to configured stack"],
    questionFocus:
      "Generate questions strictly based on the user's technology stack, job role, and experience level.",
    evaluationCriteria: [
      "Relevance to configured stack",
      "Technical depth",
      "Communication",
      "Problem solving",
      "Role alignment",
    ],
    exampleTopics: ["Stack-specific concepts from techStack array"],
  },
};

export function getInterviewTypeProfile(type: string): InterviewTypeProfile {
  return (
    INTERVIEW_TYPE_PROFILES[type] ??
    INTERVIEW_TYPE_PROFILES.custom
  );
}

export function buildInterviewContextBlock(config: InterviewConfig): string {
  const profile = getInterviewTypeProfile(config.type);
  const company = config.customCompany || config.company || "General";
  const stack =
    config.techStack.length > 0
      ? config.techStack.join(", ")
      : "Use interview type defaults";
  const topics = config.topics ?? [];
  const distribution = config.questionDistribution ?? "ai_decide";

  const topicSection =
    topics.length > 0
      ? `### Selected Topics (ONLY generate questions from these)
${topics
  .map(
    (t) =>
      `- ${t.name} | difficulty: ${t.difficulty} | target questions: ${t.questionCount}${
        t.isWeak ? " | WEAK TOPIC (prioritize)" : ""
      }`
  )
  .join("\n")}

### Question Distribution Mode
${distribution}

STRICT TOPIC RULE: Do NOT invent topics outside this list. Every question.topic must match one selected topic name exactly.`
      : `### Topics
No topics manually selected — choose a balanced set of topics from the technology stack and interview type. Prefer variety across ${profile.exampleTopics.slice(0, 5).join(", ")}.`;

  return `## INTERVIEW TYPE (STRICT — MUST FOLLOW)
Type: ${profile.label} (${config.type})
Category: ${profile.category}

### Question Focus
${profile.questionFocus}

### Allowed Topics (ONLY ask about these — unless Selected Topics override below)
${profile.allowedTopics.map((t) => `- ${t}`).join("\n")}

### FORBIDDEN Topics (NEVER ask about these)
${profile.forbiddenTopics.map((t) => `- ${t}`).join("\n")}

### Example Topics for This Interview
${profile.exampleTopics.map((t) => `- ${t}`).join("\n")}

${topicSection}

## CANDIDATE CONTEXT
- Job Role: ${config.jobRole || "Software Engineer"}
- Experience Level: ${config.experienceLevel || "Mid-Level"}
- Overall Difficulty: ${config.difficulty}
- Target Company: ${company}
- Technology Stack: ${stack}
- Interview Duration: ${config.duration} minutes
- Planned Questions: ${config.questionCount}

## STRICT RULES
1. EVERY question must be directly relevant to "${profile.label}" and the technology stack.
2. NEVER cross categories (e.g., no coding in HR, no HR in React, no Node.js in React-only interviews).
3. Calibrate depth to ${config.experienceLevel || "Mid-Level"} at ${config.difficulty} difficulty (override with per-topic difficulty when provided).
4. ${company !== "General" ? `Reflect ${company}'s interview style where appropriate.` : "Use industry-standard interview style."}
5. When tech stack is specified, prioritize those technologies in every question.
6. Never generate duplicate questions within this interview.`;
}

export function buildQuestionGenerationUserPrompt(
  config: InterviewConfig,
  count: number
): string {
  const profile = getInterviewTypeProfile(config.type);
  const stackList =
    config.techStack.length > 0
      ? config.techStack.join(", ")
      : "infer from interview type";
  const topics = config.topics ?? [];
  const company = config.customCompany || config.company || "General";

  const quotaBlock =
    topics.length > 0
      ? topics
          .map(
            (t) =>
              `- topic: "${t.name}" | difficulty: ${t.difficulty} | questions: ${t.questionCount}`
          )
          .join("\n")
      : `- Generate ${count} balanced questions for this interview type`;

  return `FULL USER CONFIGURATION (mandatory — obey every field):
- Interview Type: ${config.type} (${profile.label})
- Job Role: ${config.jobRole || "Software Engineer"}
- Experience Level: ${config.experienceLevel || "Mid-Level"}
- Overall Difficulty: ${config.difficulty}
- Technology Stack: ${stackList}
- Company: ${company}
- Duration: ${config.duration} minutes
- Total Questions Required: ${count}
- Distribution Mode: ${config.questionDistribution ?? "custom"}

PER-TOPIC QUOTA (exact counts required):
${quotaBlock}

OUTPUT REQUIREMENTS:
1. Return a JSON object with a "questions" array of length EXACTLY ${count}.
2. For each topic above, produce EXACTLY that many questions.
3. Every question must include: content, type, topic, difficulty, hints, idealAnswerOutline.
4. question.topic must be copied EXACTLY from the quota list (same spelling/casing).
5. question.difficulty must match that topic's difficulty (use overall difficulty when topic difficulty is "mixed").
6. No duplicates. No unrelated topics. No missing topics.

${buildInterviewContextBlock(config)}

Return valid JSON only.`;
}

export function buildTopicRepairUserPrompt(
  config: InterviewConfig,
  topicName: string,
  difficulty: string,
  missingCount: number,
  existingQuestions: string[]
): string {
  return `Generate EXACTLY ${missingCount} additional interview question(s) for ONE topic only.

CONFIGURATION:
- Interview Type: ${config.type}
- Job Role: ${config.jobRole || "Software Engineer"}
- Experience Level: ${config.experienceLevel || "Mid-Level"}
- Technology Stack: ${config.techStack.join(", ") || "n/a"}
- Topic (exact): "${topicName}"
- Difficulty: ${difficulty}

EXISTING QUESTIONS FOR THIS TOPIC (do not duplicate):
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") || "(none)"}

Return JSON:
{
  "questions": [
    {
      "content": "...",
      "type": "${config.type}",
      "topic": "${topicName}",
      "difficulty": "${difficulty}",
      "hints": ["..."],
      "idealAnswerOutline": ["...", "...", "..."]
    }
  ]
}

The questions array length MUST be exactly ${missingCount}.
Every question.topic MUST be exactly "${topicName}".`;
}
