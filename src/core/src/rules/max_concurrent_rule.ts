import { Pickle } from '@cucumber/messages';
import { IPickleRule } from "./types";
import { IPickleMatcher } from '../matchers';
import { DisposableEntity } from '../common/entity';
import { RuleEvaluationResult } from './evaluation_result';

// Restricts how many pickles matching a given matcher can run at the same time
export class MaxConcurrentRule extends DisposableEntity implements IPickleRule {
    public readonly name: string = 'MaxConcurrentRule';
    public readonly maxConcurrent: number;
    public readonly matcher: IPickleMatcher;

    constructor(maxConcurrent: number, matcher: IPickleMatcher) {
        super('max-rule');
        this.maxConcurrent = maxConcurrent;
        this.matcher = matcher;
    }

    canRun(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        _runnedPickles: Pickle[]
    ): boolean {
        if (this._isDisposed) return true;
        if (!this.matcher.match(pickleInQuestion)) return true;

        let matchedRunning = 0;
        for (const runningPickle of runningPickles) {
            if (this.matcher.match(runningPickle)) matchedRunning++;
            if (matchedRunning >= this.maxConcurrent) {
                return false;
            }
        }
        return true;
    }

    evaluate(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        _runnedPickles: Pickle[]
    ): RuleEvaluationResult {
        if (this._isDisposed) {
            return RuleEvaluationResult.allowed(
                'Rule is disposed - allowing all scenarios'
            );
        }

        if (!this.matcher.match(pickleInQuestion)) {
            return RuleEvaluationResult.allowed(
                'Scenario does not match this rule\'s criteria'
            );
        }

        const matchingRunningPickles = runningPickles.filter(p => this.matcher.match(p));
        const currentConcurrency = matchingRunningPickles.length;

        if (currentConcurrency >= this.maxConcurrent) {
            return RuleEvaluationResult.blocked(
                `Maximum concurrency limit reached (${currentConcurrency}/${this.maxConcurrent})`,
                {
                    relatedPickles: matchingRunningPickles,
                    metadata: {
                        currentConcurrency,
                        maxConcurrency: this.maxConcurrent,
                        matcherType: this.matcher.constructor.name,
                        matcherId: this.matcher.id
                    }
                }
            );
        }

        return RuleEvaluationResult.allowed(
            `Concurrency limit allows execution (${currentConcurrency + 1}/${this.maxConcurrent})`
        );
    }

    getMatchers(): IPickleMatcher[] {
        return [this.matcher];
    }

    public toString(): string {
        return `MaxConcurrentRule(max: ${this.maxConcurrent}, matcher: ${this.matcher})`;
    }
}