/**
 * Result of a rule evaluation with detailed information
 */
export class RuleEvaluationResult {
    public readonly allowed: boolean;
    /** Human-readable reason for the evaluation result */
    public readonly reason?: string;
    /** Additional metadata */
    public readonly metadata?: Record<string, any>;
    public readonly evaluatedAt: Date;

    constructor(
        allowed: boolean,
        reason?: string,
        metadata?: Record<string, any>
    ) {
        this.allowed = allowed;
        this.reason = reason;
        this.metadata = metadata;
        this.evaluatedAt = new Date();
    }

    /**
     * Create a result indicating the pickle is allowed to run
     */
    static allowed(reason?: string, metadata?: Record<string, any>): RuleEvaluationResult {
        return new RuleEvaluationResult(true, reason, metadata);
    }

    /**
     * Create a result indicating the pickle is blocked
     */
    static blocked(reason: string, metadata?: Record<string, any>): RuleEvaluationResult {
        return new RuleEvaluationResult(false, reason, metadata);
    }

    /**
     * Create a result with a warning (still allowed but with concerns)
     */
    static warning(reason: string, metadata?: Record<string, any>): RuleEvaluationResult {
        return new RuleEvaluationResult(true, reason, metadata);
    }

    /**
     * Convert to a simple object for serialization
     */
    toJSON() {
        return {
            allowed: this.allowed,
            reason: this.reason,
            metadata: this.metadata,
            evaluatedAt: this.evaluatedAt.toISOString(),
        };
    }
}
