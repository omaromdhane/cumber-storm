import type { Pickle } from '@cucumber/messages';

/**
 * Minimal rule interface for reporting purposes.
 * Avoids circular dependency with @cumberstorm/core.
 */
export interface IReportableRule {
    id: string;
    name: string;
    matchers: IReportableMatcher[];
}

/**
 * Minimal matcher interface for reporting purposes.
 */
export interface IReportableMatcher {
    id: string;
    level: string;
    type: string;
    /** Human-readable description of what this matcher matches against */
    pattern?: string;
    /** Whether case is ignored during matching */
    ignoreCase?: boolean;
}

/**
 * Minimal evaluation result for reporting purposes.
 */
export interface IReportableEvaluationResult {
    allowed: boolean;
    reason?: string;
    metadata?: Record<string, unknown>;
    evaluatedAt: Date;
}

export interface IRuleResult {
    rule: IReportableRule;
    result: IReportableEvaluationResult;
}

export interface ISchedulingDecision {
    candidate: Pickle;
    runningPickles: Pickle[];
    runnedPickles: Pickle[];
    rules_results: IRuleResult[];
}

export interface IRuleStats {
    rule: IReportableRule;
    totalEvaluations: number;
    allowedCount: number;
    blockedCount: number;
    matchers: IReportableMatcher[];
}

export interface IConcurrencySnapshot {
    timestamp: Date;
    runningCount: number;
}

export interface ICumberStormReport {
    startTime?: Date;
    endTime?: Date;
    duration?: number;

    schedulingDecisions: ISchedulingDecision[];
    totalDecisions: number;
    allowedDecisions: number;
    blockedDecisions: number;

    maxConcurrency: number;
    minConcurrency: number;
    averageConcurrency: number;
    concurrencySnapshots: IConcurrencySnapshot[];

    ruleStats: IRuleStats[];
}
