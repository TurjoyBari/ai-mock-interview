import type { InterviewConfig } from "@/types";
import { INTERVIEW_TYPE_PROFILES } from "@/lib/prompts/interview-types";

const PLACEHOLDER_PATTERNS = [
  /strong candidates provide/i,
  /structured answers with measurable outcomes/i,
  /candidates (should|typically|usually)/i,
  /interviewers expect specific concepts/i,
  /use (the )?star method/i,
  /expand with a specific example/i,
  /would (define|explain) the concept clearly/i,
  /a strong answer to this/i,
  /^(you should|they should|make sure to)/i,
  /ideal answer (should|would) include/i,
  /in an interview,? you (should|would)/i,
];

/** Detect meta-advice, templates, or placeholder text masquerading as an ideal answer. */
export function isPlaceholderIdealAnswer(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 80) return true;
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (/^(tip:|note:|remember:|advice:)/i.test(trimmed)) return true;
  return false;
}

type TopicAnswer = {
  pattern: RegExp;
  answer: string;
};

const TOPIC_IDEAL_ANSWERS: TopicAnswer[] = [
  {
    pattern: /\bclosure\b/i,
    answer: `A closure is a JavaScript feature where an inner function retains access to variables from its outer lexical scope, even after the outer function has finished executing. This happens because JavaScript preserves the lexical environment in which the inner function was created.

For example, imagine we create a createCounter() function. Inside it, we define a private variable called count and return another function that increments and returns this value. Even after createCounter() finishes execution, the returned function still remembers count because of the closure.

A practical use case is creating private state or encapsulating data. Closures are also widely used in event handlers, callbacks, asynchronous programming, React Hooks, and module patterns.

In summary, I would explain to an interviewer that closures allow functions to preserve access to their lexical environment, making them powerful for maintaining state, implementing data privacy, and writing modular JavaScript code.`,
  },
  {
    pattern: /event loop/i,
    answer: `The JavaScript event loop is the mechanism that lets JavaScript handle asynchronous operations on a single thread. When code runs, the call stack executes synchronous work. When we hit async APIs like setTimeout, fetch, or I/O, those tasks are handed off to the browser or Node.js APIs, and their callbacks go into the task queue or microtask queue.

The event loop continuously checks: if the call stack is empty, it takes the next task from the microtask queue first, then the macrotask queue. That is why Promise callbacks run before setTimeout callbacks.

In practice, this explains why blocking the main thread freezes the UI, and why we use async patterns to keep applications responsive. I would also mention that understanding microtasks versus macrotasks helps debug ordering bugs in production code.`,
  },
  {
    pattern: /\b(var|let|const)\b.*\b(difference|compare)/i,
    answer: `var, let, and const all declare variables in JavaScript, but they behave differently. var is function-scoped and hoisted with an initial value of undefined, which can cause subtle bugs in larger codebases. let and const are block-scoped, which makes code easier to reason about in loops and conditionals.

const prevents reassignment of the binding, though object properties can still be mutated. let allows reassignment when the value needs to change. In modern JavaScript, I default to const, use let when reassignment is required, and avoid var unless maintaining legacy code.

In an interview, I would emphasize that block scoping reduces accidental overwrites and is one reason teams migrated to let and const after ES6.`,
  },
  {
    pattern: /prototypal inheritance/i,
    answer: `JavaScript uses prototypal inheritance, meaning objects can inherit properties directly from other objects through the prototype chain. When you access a property on an object, JavaScript looks on that object first, then walks up through __proto__ until it finds the property or reaches null.

When we use class syntax, it is syntactic sugar over constructor functions and prototypes. Methods on a class prototype are shared across instances, which is memory efficient.

A practical example: if Animal.prototype.speak exists, Dog instances created with Object.create or class extension can access speak through the chain. I would also mention hasOwnProperty versus inherited properties, because interviewers often want to see that you understand lookup versus own fields.`,
  },
  {
    pattern: /===|strict equality|loose equality/i,
    answer: `== performs type coercion before comparing values, while === checks both value and type without coercion. For example, 0 == false is true, but 0 === false is false. That coercion behavior is a common source of bugs.

In production code, I use === by default because it is more predictable. I only use == in very intentional cases, such as checking for null or undefined with value == null.

In an interview, I would explain that strict equality makes code easier to review and helps avoid edge cases, especially when comparing strings, numbers, and booleans from APIs or user input.`,
  },
  {
    pattern: /promise|async\/await/i,
    answer: `Promises represent the eventual result of an asynchronous operation — either fulfillment or rejection. async/await is syntactic sugar on top of Promises that makes asynchronous code read like synchronous code.

When I use async/await, I almost always wrap logic in try/catch so rejections are handled explicitly. I also use Promise.all for parallel independent requests and Promise.allSettled when I need every result even if some fail.

For example, when loading dashboard data, I might await user profile and permissions in parallel with Promise.all to reduce latency. I would mention that async functions always return a Promise, which is a detail interviewers like to hear.`,
  },
  {
    pattern: /debounc|throttl/i,
    answer: `Debouncing and throttling both control how often a function runs, but they solve different problems. Debouncing waits until activity stops — great for search input where we only call the API after the user pauses typing. Throttling limits execution to once per time window — great for scroll or resize handlers.

In a React search component, I might debounce input by 300ms before firing a query. For a window resize listener, I would throttle updates so layout recalculations do not run hundreds of times per second.

I would close by saying both patterns protect performance and improve user experience, and the choice depends on whether we care about the final state or periodic updates.`,
  },
  {
    pattern: /reconciliation|virtual dom/i,
    answer: `React reconciliation is the process React uses to compare the new virtual DOM with the previous one and determine the minimum set of real DOM changes to apply. When state or props change, React builds a new element tree, diffs it, and updates only what changed.

The virtual DOM is a lightweight JavaScript representation of the UI. It is not always faster than direct DOM manipulation for every case, but it gives React a structured way to batch updates and keep UI logic declarative.

In interviews, I also mention keys in lists because improper keys cause inefficient re-renders, and I explain that React 18's concurrent features build on this reconciliation model to prioritize urgent updates.`,
  },
  {
    pattern: /useEffect/i,
    answer: `useEffect lets functional components run side effects after render — things like data fetching, subscriptions, or manual DOM updates. The dependency array controls when the effect re-runs: an empty array means run once on mount, omitted means run after every render, and listed dependencies mean run when those values change.

A common pattern I use is fetching data when an id changes, with a cleanup function to cancel in-flight requests and avoid race conditions. I also watch for stale closures by including the right dependencies or using functional updates.

I would tell the interviewer that misuse of useEffect — especially missing dependencies or over-fetching — is a frequent source of bugs, so I treat dependency arrays seriously and prefer derived state when possible.`,
  },
  {
    pattern: /useMemo|useCallback/i,
    answer: `useMemo memoizes a computed value; useCallback memoizes a function reference. I reach for them when expensive calculations or stable callback references prevent unnecessary child re-renders, especially when passing props to memoized components.

They are not free — memoization has its own cost — so I do not wrap everything by default. I profile first or identify a known expensive render path.

For example, if a filtered list is expensive and a parent re-renders often, useMemo on the filtered array helps. If a child wrapped in React.memo receives an inline callback, useCallback can stop redundant renders. That trade-off awareness is what interviewers want to hear.`,
  },
  {
    pattern: /\bSSR\b|\bSSG\b|\bISR\b|server.?side rendering/i,
    answer: `SSR renders pages on each request, which is great for highly dynamic or personalized content. SSG generates pages at build time, which is ideal for content that rarely changes and needs maximum speed. ISR combines static generation with timed revalidation, so pages stay fast but can refresh in the background.

In Next.js, I choose SSR when data must be fresh per user, SSG for marketing or docs pages, and ISR for product catalogs or blogs that update periodically without rebuilding the entire site.

I would explain that the decision is really about freshness versus performance versus infrastructure cost, and I pick the strategy based on how often content changes and how personalized it needs to be.`,
  },
  {
    pattern: /tell me about yourself/i,
    answer: `I would structure this as a concise professional narrative in about 90 seconds. I start with my current role and core expertise, then highlight two or three relevant accomplishments with measurable impact, and close by connecting my background to why this role is a strong fit.

For example: "I am a software engineer with five years of experience building full-stack web applications, mostly with React and Node.js. In my current role, I led development of a customer dashboard that reduced support tickets by 30% through better self-service analytics. Before that, I worked on API performance improvements that cut average response time by 40%. I am excited about this position because it combines the product-focused frontend work I enjoy with the scale challenges your team is solving."

The key is relevance — I tailor the story to the job description rather than listing every job I have ever had.`,
  },
  {
    pattern: /conflict|difficult situation|disagreement/i,
    answer: `I would answer this with STAR. Situation: on a recent project, two engineers disagreed on whether to ship a feature behind a flag or delay for more testing. Task: as the tech lead, I needed a decision that protected quality without blocking the roadmap. Action: I facilitated a short meeting where each side shared risks and data — we reviewed incident history and user impact. We agreed to ship behind a feature flag with enhanced monitoring and a rollback plan. Result: we launched on time, caught a edge-case bug in staging for flagged users only, and the approach became our default for risky releases.

What interviewers want here is emotional maturity, collaboration, and a result that shows I de-escalate conflict with process and data, not ego.`,
  },
  {
    pattern: /REST|RESTful/i,
    answer: `REST is an architectural style for APIs that uses HTTP methods meaningfully: GET for reads, POST for creates, PUT or PATCH for updates, DELETE for removes. Resources are represented as URLs, and stateless requests make scaling straightforward.

Good REST APIs use proper status codes, consistent naming, versioning when needed, and pagination for large collections. I also design error responses with machine-readable codes and human-readable messages.

In practice, I might break strict REST when an action does not map cleanly to a resource — for example, a POST to /orders/{id}/cancel is clearer than forcing DELETE semantics. Interviewers appreciate knowing when pragmatic RPC-style endpoints are okay.`,
  },
  {
    pattern: /ACID/i,
    answer: `ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity means a transaction either fully completes or fully rolls back. Consistency ensures database rules and constraints remain valid. Isolation controls how concurrent transactions see each other's work. Durability guarantees committed data survives crashes.

These properties matter when handling payments, inventory, or any operation where partial writes cause real business problems. For example, transferring funds requires debiting one account and crediting another atomically.

I would also mention that NoSQL systems sometimes relax certain guarantees for scale, so choosing the right datastore depends on how strictly we need transactional behavior.`,
  },
  {
    pattern: /SQL.*JOIN|types of.*JOIN/i,
    answer: `SQL JOINs combine rows from multiple tables based on related keys. INNER JOIN returns only matching rows in both tables. LEFT JOIN returns all rows from the left table plus matches from the right. RIGHT JOIN is the mirror of that. FULL OUTER JOIN returns matches and unmatched rows from both sides.

A practical example: customers LEFT JOIN orders shows every customer, including those who never purchased, which is useful for retention analysis. INNER JOIN customers orders shows only customers who have orders, which is useful for revenue reporting.

I would add that join performance depends heavily on indexing foreign keys, and that is often where slow reporting queries come from in production.`,
  },
  {
    pattern: /generics/i,
    answer: `Generics let us write reusable, type-safe code without sacrificing type information. Instead of using any, we define a type parameter like T that is resolved when the function or class is used.

For example, a function identity<T>(value: T): T preserves the exact type of the argument. In React, generics appear in hooks like useState<string | null> or in reusable API helpers where the response shape changes per endpoint.

In an interview, I would say generics catch errors at compile time, improve autocomplete, and document intent — they are essential for maintainable TypeScript codebases.`,
  },
  {
    pattern: /microservice/i,
    answer: `Microservices split an application into independently deployable services, each owning a bounded part of the business domain. Benefits include independent scaling, team autonomy, and technology flexibility. Trade-offs include distributed system complexity — network latency, observability, data consistency, and deployment coordination all get harder.

I would use microservices when team scale or scaling requirements justify the operational cost. For early products, a well-structured monolith is often faster to ship and easier to debug.

A concrete example: separating payments into its own service isolates PCI compliance scope and lets the payments team deploy without coupling to the entire storefront release cycle.`,
  },
];

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = b.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (wordsB.length === 0) return 0;
  let matches = 0;
  for (const w of wordsB) {
    if (wordsA.has(w)) matches++;
  }
  return matches / wordsB.length;
}

function matchTopicAnswer(question: string): string | null {
  for (const { pattern, answer } of TOPIC_IDEAL_ANSWERS) {
    if (pattern.test(question)) return answer;
  }
  return null;
}

function buildTypeAwareAnswer(question: string, config: InterviewConfig): string {
  const profile = INTERVIEW_TYPE_PROFILES[config.type];
  const topics = profile?.exampleTopics?.slice(0, 3) ?? [
    "the core concept",
    "a practical example",
    "trade-offs or edge cases",
  ];
  const stack = config.techStack.slice(0, 2).join(" and ");
  const role = config.jobRole || "software engineer";
  const cleanQ = question.replace(/\s+/g, " ").trim();

  return `When asked "${cleanQ}", I would give a direct answer first, then support it with depth.

${topics[0].charAt(0).toUpperCase() + topics[0].slice(1)}: I define the concept in plain language and explain the underlying mechanism — not just what it is, but how it works and when it applies.

Practical example: In my experience as a ${role}${stack ? ` working with ${stack}` : ""}, I have applied this on real projects. For instance, I would describe a specific situation, what approach I took, and what outcome we measured — latency improved, bugs reduced, or delivery sped up.

${topics[1].charAt(0).toUpperCase() + topics[1].slice(1)}: I connect the concept to the team's context and mention trade-offs — performance versus complexity, consistency versus availability, or speed versus maintainability.

I close by summarizing the one sentence an interviewer should remember, so my answer feels complete and confident without rambling.`;
}

/** Generate a complete, speakable ideal interview answer — never meta-advice. */
export function buildFallbackIdealAnswer(
  question: string,
  config: InterviewConfig
): string {
  const topicMatch = matchTopicAnswer(question);
  if (topicMatch) return topicMatch;

  const normalizedQ = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  let bestScore = 0;
  let bestAnswer: string | null = null;

  for (const { pattern, answer } of TOPIC_IDEAL_ANSWERS) {
    const patternWords = pattern.source.replace(/\\b/g, "").replace(/[^a-z0-9\s]/gi, " ");
    const score = wordOverlap(normalizedQ, patternWords);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = answer;
    }
  }
  if (bestScore >= 0.5 && bestAnswer) return bestAnswer;

  return buildTypeAwareAnswer(question, config);
}

/** Shorter 30–90 second spoken version derived from the ideal answer. */
export function buildFallbackPracticeVersion(
  idealAnswer: string,
  question: string,
  config: InterviewConfig
): string {
  if (isPlaceholderIdealAnswer(idealAnswer)) {
    idealAnswer = buildFallbackIdealAnswer(question, config);
  }

  const sentences = idealAnswer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 3) return idealAnswer;

  const intro = sentences[0];
  const example = sentences.find((s) =>
    /for example|for instance|in my|practical/i.test(s)
  ) ?? sentences[1];
  const closing =
    sentences.find((s) => /summary|in short|i would explain|to summarize/i.test(s)) ??
    sentences[sentences.length - 1];

  return [intro, example, closing].filter(Boolean).join(" ");
}

/** Replace placeholder ideal answers with a real generated answer. */
export function ensureValidIdealAnswer(
  text: string,
  question: string,
  config: InterviewConfig
): string {
  if (!isPlaceholderIdealAnswer(text)) return text.trim();
  return buildFallbackIdealAnswer(question, config);
}

export function ensureValidPracticeVersion(
  text: string,
  idealAnswer: string,
  question: string,
  config: InterviewConfig
): string {
  const validIdeal = ensureValidIdealAnswer(idealAnswer, question, config);
  if (!isPlaceholderIdealAnswer(text) && text.trim().length >= 60) return text.trim();
  return buildFallbackPracticeVersion(validIdeal, question, config);
}
