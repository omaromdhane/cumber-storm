import type {
  ICumberStormReport,
  IReportableEvaluationResult,
  IReportableRule,
  IReportableMatcher,
  IRuleResult,
  ISchedulingDecision,
  IRuleStats,
} from '@cumberstorm/reporting';
import type { Pickle, PickleStep, PickleTag } from '@cucumber/messages';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 0;
const uid = (prefix = 'id') => `${prefix}-${(++_seq).toString(16).padStart(6, '0')}`;

const makeResult = (
  allowed: boolean,
  reason?: string,
  metadata?: Record<string, unknown>,
): IReportableEvaluationResult => ({
  allowed,
  reason,
  metadata,
  evaluatedAt: new Date(),
});

function makeTag(name: string): PickleTag {
  return { name, astNodeId: uid('ast'), astNodeIds: [] } as unknown as PickleTag;
}

function makeStep(keyword: string, text: string): PickleStep {
  return {
    id: uid('step'),
    text,
    type: keyword as PickleStep['type'],
    astNodeIds: [uid('ast')],
  } as PickleStep;
}

function makePickle(
  name: string,
  uri: string,
  tags: string[],
  steps: { keyword: string; text: string }[],
): Pickle {
  const id = uid('pickle');
  return {
    id,
    name,
    uri,
    language: 'en',
    astNodeIds: [uid('ast')],
    tags: tags.map(t => makeTag(t)),
    steps: steps.map(s => makeStep(s.keyword, s.text)),
  } as Pickle;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const MAX_CONCURRENT_ID = 'rule-max-concurrent-001';
const EXCLUSIVE_DB_ID = 'rule-exclusive-db-002';
const SEQUENTIAL_AUTH_ID = 'rule-sequential-auth-003';

const MAX_CONCURRENT_RULE: IReportableRule = {
  id: MAX_CONCURRENT_ID,
  name: 'max-concurrent',
  matchers: [
    { id: uid('matcher'), level: 'ANY_PICKLE', type: 'ANY', pattern: '*' } satisfies IReportableMatcher,
  ],
};

const EXCLUSIVE_DB_RULE: IReportableRule = {
  id: EXCLUSIVE_DB_ID,
  name: 'exclusive',
  matchers: [
    { id: uid('matcher'), level: 'TAG', type: 'ANY_TAG', pattern: 'anyTag: [@database]' } satisfies IReportableMatcher,
    { id: uid('matcher'), level: 'TAG', type: 'ANY_TAG', pattern: 'anyTag: [@api]' } satisfies IReportableMatcher,
  ],
};

const SEQUENTIAL_AUTH_RULE: IReportableRule = {
  id: SEQUENTIAL_AUTH_ID,
  name: 'sequential',
  matchers: [
    { id: uid('matcher'), level: 'SCENARIO_NAME', type: 'REGEX', pattern: 'pattern: ".*login.*"' } satisfies IReportableMatcher,
    { id: uid('matcher'), level: 'SCENARIO_NAME', type: 'REGEX', pattern: 'pattern: ".*reset.*"' } satisfies IReportableMatcher,
    { id: uid('matcher'), level: 'SCENARIO_NAME', type: 'REGEX', pattern: 'pattern: ".*logout.*"' } satisfies IReportableMatcher,
  ],
};

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const SCENARIOS: Pickle[] = [
  makePickle('User can login with valid credentials', 'features/auth/login.feature', ['@auth', '@smoke'], [
    { keyword: 'Given', text: 'the user is on the login page' },
    { keyword: 'When', text: 'the user enters valid credentials' },
    { keyword: 'Then', text: 'the user is redirected to the dashboard' },
  ]),
  makePickle('User cannot login with invalid password', 'features/auth/login.feature', ['@auth', '@negative'], [
    { keyword: 'Given', text: 'the user is on the login page' },
    { keyword: 'When', text: 'the user enters an invalid password' },
    { keyword: 'Then', text: 'an error message is displayed' },
  ]),
  makePickle('User can logout successfully', 'features/auth/logout.feature', ['@auth', '@smoke'], [
    { keyword: 'Given', text: 'the user is logged in' },
    { keyword: 'When', text: 'the user clicks logout' },
    { keyword: 'Then', text: 'the user is redirected to the login page' },
  ]),
  makePickle('User can reset password', 'features/auth/password-reset.feature', ['@auth'], [
    { keyword: 'Given', text: 'the user is on the password reset page' },
    { keyword: 'When', text: 'the user submits their email' },
    { keyword: 'Then', text: 'a reset email is sent' },
  ]),
  makePickle('Admin can access dashboard', 'features/admin/dashboard.feature', ['@admin', '@smoke'], [
    { keyword: 'Given', text: 'an admin user is logged in' },
    { keyword: 'When', text: 'the admin navigates to the dashboard' },
    { keyword: 'Then', text: 'the admin dashboard is displayed' },
  ]),
  makePickle('Admin can view user list', 'features/admin/users.feature', ['@admin', '@database'], [
    { keyword: 'Given', text: 'an admin user is logged in' },
    { keyword: 'When', text: 'the admin navigates to the user list' },
    { keyword: 'Then', text: 'all users are displayed' },
  ]),
  makePickle('Admin can create new user', 'features/admin/users.feature', ['@admin', '@database'], [
    { keyword: 'Given', text: 'an admin user is logged in' },
    { keyword: 'When', text: 'the admin creates a new user with valid data' },
    { keyword: 'Then', text: 'the new user appears in the user list' },
  ]),
  makePickle('User can view profile', 'features/profile/view.feature', ['@profile', '@smoke'], [
    { keyword: 'Given', text: 'the user is logged in' },
    { keyword: 'When', text: 'the user navigates to their profile' },
    { keyword: 'Then', text: 'the profile information is displayed' },
  ]),
  makePickle('User can update profile information', 'features/profile/edit.feature', ['@profile'], [
    { keyword: 'Given', text: 'the user is on their profile page' },
    { keyword: 'When', text: 'the user updates their display name' },
    { keyword: 'Then', text: 'the profile is updated successfully' },
  ]),
  makePickle('User can upload profile picture', 'features/profile/picture.feature', ['@profile', '@slow'], [
    { keyword: 'Given', text: 'the user is on their profile page' },
    { keyword: 'When', text: 'the user uploads a valid image file' },
    { keyword: 'Then', text: 'the profile picture is updated' },
  ]),
  makePickle('User can create new post', 'features/posts/create.feature', ['@posts', '@database'], [
    { keyword: 'Given', text: 'the user is logged in' },
    { keyword: 'When', text: 'the user submits a new post' },
    { keyword: 'Then', text: 'the post appears in the feed' },
  ]),
  makePickle('User can edit own post', 'features/posts/edit.feature', ['@posts', '@database'], [
    { keyword: 'Given', text: 'the user has an existing post' },
    { keyword: 'When', text: 'the user edits the post content' },
    { keyword: 'Then', text: 'the post is updated' },
  ]),
  makePickle('User can delete own post', 'features/posts/delete.feature', ['@posts', '@database'], [
    { keyword: 'Given', text: 'the user has an existing post' },
    { keyword: 'When', text: 'the user deletes the post' },
    { keyword: 'Then', text: 'the post is removed from the feed' },
  ]),
  makePickle('User can view all posts', 'features/posts/list.feature', ['@posts', '@smoke'], [
    { keyword: 'Given', text: 'there are posts in the system' },
    { keyword: 'When', text: 'the user navigates to the feed' },
    { keyword: 'Then', text: 'all posts are displayed' },
  ]),
  makePickle('User can comment on post', 'features/comments/create.feature', ['@comments', '@database'], [
    { keyword: 'Given', text: 'the user is viewing a post' },
    { keyword: 'When', text: 'the user submits a comment' },
    { keyword: 'Then', text: 'the comment appears under the post' },
  ]),
  makePickle('User can like a post', 'features/likes/create.feature', ['@likes'], [
    { keyword: 'Given', text: 'the user is viewing a post' },
    { keyword: 'When', text: 'the user clicks the like button' },
    { keyword: 'Then', text: 'the like count increases' },
  ]),
  makePickle('User can search posts', 'features/search/posts.feature', ['@search', '@slow'], [
    { keyword: 'Given', text: 'there are posts in the system' },
    { keyword: 'When', text: 'the user searches for a keyword' },
    { keyword: 'Then', text: 'matching posts are displayed' },
  ]),
  makePickle('User can filter posts by tag', 'features/search/filter.feature', ['@search'], [
    { keyword: 'Given', text: 'there are tagged posts in the system' },
    { keyword: 'When', text: 'the user filters by a tag' },
    { keyword: 'Then', text: 'only matching posts are shown' },
  ]),
  makePickle('User can receive notifications', 'features/notifications/list.feature', ['@notifications'], [
    { keyword: 'Given', text: 'the user has unread notifications' },
    { keyword: 'When', text: 'the user opens the notification panel' },
    { keyword: 'Then', text: 'all notifications are listed' },
  ]),
  makePickle('User can mark notification as read', 'features/notifications/read.feature', ['@notifications'], [
    { keyword: 'Given', text: 'the user has an unread notification' },
    { keyword: 'When', text: 'the user marks it as read' },
    { keyword: 'Then', text: 'the notification is marked as read' },
  ]),
  makePickle('User can send direct message', 'features/messages/send.feature', ['@messages', '@slow'], [
    { keyword: 'Given', text: 'the user is on the messaging page' },
    { keyword: 'When', text: 'the user sends a message to another user' },
    { keyword: 'Then', text: 'the message appears in the conversation' },
  ]),
  makePickle('User can view message history', 'features/messages/history.feature', ['@messages'], [
    { keyword: 'Given', text: 'the user has a conversation with another user' },
    { keyword: 'When', text: 'the user opens the conversation' },
    { keyword: 'Then', text: 'the full message history is displayed' },
  ]),
  makePickle('User can delete message', 'features/messages/delete.feature', ['@messages'], [
    { keyword: 'Given', text: 'the user has sent a message' },
    { keyword: 'When', text: 'the user deletes the message' },
    { keyword: 'Then', text: 'the message is removed from the conversation' },
  ]),
  makePickle('System can send email notification', 'features/system/email.feature', ['@system', '@slow'], [
    { keyword: 'Given', text: 'a user action triggers an email notification' },
    { keyword: 'When', text: 'the system processes the event' },
    { keyword: 'Then', text: 'an email is sent to the user' },
  ]),
  makePickle('System can generate daily report', 'features/system/reports.feature', ['@system', '@slow'], [
    { keyword: 'Given', text: 'it is the end of the day' },
    { keyword: 'When', text: 'the report generation job runs' },
    { keyword: 'Then', text: 'a daily report is created and stored' },
  ]),
];

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export function generateFakeReport(): ICumberStormReport {
  const startTime = new Date('2024-12-05T10:00:00');
  const MAX_CONCURRENT = 4;

  // Track rule evaluation counts
  const ruleEvals: Record<string, { allowed: number; blocked: number }> = {
    [MAX_CONCURRENT_ID]: { allowed: 0, blocked: 0 },
    [EXCLUSIVE_DB_ID]: { allowed: 0, blocked: 0 },
    [SEQUENTIAL_AUTH_ID]: { allowed: 0, blocked: 0 },
  };

  const decisions: ISchedulingDecision[] = [];
  const running: Pickle[] = [];
  const done: Pickle[] = [];

  // Auth scenarios must run in order: login -> reset -> logout
  let authStep = 0;

  // DB-tagged scenarios are exclusive with each other
  const dbTags = new Set(['@database']);
  const isDb = (p: Pickle) => p.tags.some(t => dbTags.has(t.name));
  const dbRunning = () => running.filter(isDb);

  SCENARIOS.forEach((scenario, index) => {
    const elapsed = index * 42_000; // ~42s per decision
    const timestamp = new Date(startTime.getTime() + elapsed);

    // --- Evaluate rules ---

    // 1. max-concurrent: allow if running < MAX_CONCURRENT
    const concurrencyOk = running.length < MAX_CONCURRENT;
    const concurrencyResult = makeResult(
      concurrencyOk,
      concurrencyOk
        ? `Running ${running.length}/${MAX_CONCURRENT} — within limit`
        : `Running ${running.length}/${MAX_CONCURRENT} — limit reached`,
      { currentRunning: running.length, maxAllowed: MAX_CONCURRENT },
    );

    // 2. exclusive: @database scenarios can't run concurrently
    const isDbScenario = isDb(scenario);
    const exclusiveOk = !isDbScenario || dbRunning().length === 0;
    const exclusiveResult = makeResult(
      exclusiveOk,
      exclusiveOk
        ? isDbScenario ? 'No other @database scenario running' : 'Not subject to exclusive rule'
        : `Exclusive conflict: ${dbRunning().map(p => p.name).join(', ')} is running`,
      { isDbScenario, dbRunning: dbRunning().length },
    );

    // 3. sequential: auth scenarios must run in order
    const authNames = ['login', 'reset', 'logout'];
    const authIndex = authNames.findIndex(n => scenario.name.toLowerCase().includes(n) && scenario.uri.includes('auth'));
    let sequentialOk = true;
    let sequentialReason = 'Not subject to sequential rule';
    if (authIndex !== -1) {
      sequentialOk = authIndex === authStep;
      sequentialReason = sequentialOk
        ? `Auth step ${authIndex + 1}/${authNames.length} — correct order`
        : `Auth step ${authIndex + 1} blocked — waiting for step ${authStep + 1}`;
    }
    const sequentialResult = makeResult(sequentialOk, sequentialReason, {
      authStep,
      scenarioAuthIndex: authIndex,
    });

    const ruleResults: IRuleResult[] = [
      { rule: MAX_CONCURRENT_RULE, result: { ...concurrencyResult, evaluatedAt: timestamp } },
      { rule: EXCLUSIVE_DB_RULE, result: { ...exclusiveResult, evaluatedAt: timestamp } },
      { rule: SEQUENTIAL_AUTH_RULE, result: { ...sequentialResult, evaluatedAt: timestamp } },
    ];

    // Tally rule stats
    ruleEvals[MAX_CONCURRENT_ID][concurrencyOk ? 'allowed' : 'blocked']++;
    ruleEvals[EXCLUSIVE_DB_ID][exclusiveOk ? 'allowed' : 'blocked']++;
    ruleEvals[SEQUENTIAL_AUTH_ID][sequentialOk ? 'allowed' : 'blocked']++;

    decisions.push({
      candidate: scenario,
      runningPickles: [...running],
      runnedPickles: [...done],
      rules_results: ruleResults,
    });

    // Advance state — add to running regardless of block (blocked ones still get evaluated,
    // but only actually "run" if all rules passed)
    const canRun = concurrencyOk && exclusiveOk && sequentialOk;
    if (canRun) {
      running.push(scenario);
      if (authIndex !== -1 && authIndex === authStep) authStep++;
    }

    // Complete a scenario every 3 decisions to keep running[] populated
    if (index % 3 === 2 && running.length > 0) {
      const completed = running.shift();
      if (completed) done.push(completed);
    }
  });

  // Derive top-level stats
  const allowedDecisions = decisions.filter(d => d.rules_results.every(r => r.result.allowed)).length;
  const blockedDecisions = decisions.length - allowedDecisions;

  const concurrencySnapshots = decisions.map((d, i) => ({
    timestamp: new Date(startTime.getTime() + i * 42_000),
    runningCount: d.runningPickles.length,
  }));

  const counts = concurrencySnapshots.map(s => s.runningCount);
  const endTime = new Date(startTime.getTime() + decisions.length * 42_000);

  const ruleStats: IRuleStats[] = [
    {
      rule: MAX_CONCURRENT_RULE,
      totalEvaluations: decisions.length,
      allowedCount: ruleEvals[MAX_CONCURRENT_ID].allowed,
      blockedCount: ruleEvals[MAX_CONCURRENT_ID].blocked,
      matchers: MAX_CONCURRENT_RULE.matchers,
    },
    {
      rule: EXCLUSIVE_DB_RULE,
      totalEvaluations: decisions.length,
      allowedCount: ruleEvals[EXCLUSIVE_DB_ID].allowed,
      blockedCount: ruleEvals[EXCLUSIVE_DB_ID].blocked,
      matchers: EXCLUSIVE_DB_RULE.matchers,
    },
    {
      rule: SEQUENTIAL_AUTH_RULE,
      totalEvaluations: decisions.length,
      allowedCount: ruleEvals[SEQUENTIAL_AUTH_ID].allowed,
      blockedCount: ruleEvals[SEQUENTIAL_AUTH_ID].blocked,
      matchers: SEQUENTIAL_AUTH_RULE.matchers,
    },
  ];

  return {
    startTime,
    endTime,
    duration: endTime.getTime() - startTime.getTime(),
    schedulingDecisions: decisions,
    totalDecisions: decisions.length,
    allowedDecisions,
    blockedDecisions,
    maxConcurrency: Math.max(...counts),
    minConcurrency: Math.min(...counts),
    averageConcurrency: counts.reduce((a, b) => a + b, 0) / counts.length,
    concurrencySnapshots,
    ruleStats,
  };
}
