import { Pickle } from '@cucumber/messages';
import { IPickleRule } from "./types";
import { IPickleMatcher } from '../matchers';
import { DisposableEntity } from '../common/entity';
import { RuleEvaluationResult } from './evaluation_result';

// Enforces a strict, linear execution order across individual test scenarios (Pickles).
//
// Each matcher must uniquely identify *one* Pickle. The order of matchers defines
// an exact sequence of execution dependencies between those tests.
//
// Example:
//   [matcherA, matcherB, matcherC]
// means:
//   - The Pickle matched by matcherA must complete before matcherB can start.
//   - The Pickle matched by matcherB must complete before matcherC can start.
//   - Tests not matched by any matcher are considered independent and can run anytime.
export class SequentialSingleMatchRule extends DisposableEntity implements IPickleRule {
    public readonly name: string = 'SequentialSingleMatchRule';
    private matchers: IPickleMatcher[] = [];

    constructor(matchers: IPickleMatcher[]) {
        super('seq-rule');
        this.matchers = matchers;
    }

    canRun(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        runnedPickles: Pickle[]
    ): boolean {
        if (this._isDisposed) return true;
        // Find index of pickleInQuestion in the order sequence
        const index = this.matchers.findIndex(m => m.match(pickleInQuestion));
        if (index === -1) return true; // Not part of ordered group

        // If a matching pickle has already run → block (don't throw; canRun is a probe)
        if (runnedPickles.some(p => this.matchers[index].match(p))) {
            return false;
        }

        // Rule: previous matchers must have ALL finished before running this one
        for (let i = 0; i < index; i++) {
            const previousMatcher = this.matchers[i];

            // If any previous group scenario is still running → block
            if (runningPickles.some(p => previousMatcher.match(p))) {
                return false;
            }

            // If no scenario of that group has ever been run → also block
            const anyRanBefore = runnedPickles.some(p => previousMatcher.match(p));
            if (!anyRanBefore) {
                return false;
            }
        }
        return true;
    }

    evaluate(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        runnedPickles: Pickle[]
    ): RuleEvaluationResult {
        if (this._isDisposed) {
            return RuleEvaluationResult.allowed('Rule is disposed');
        }

        // Find index of pickleInQuestion in the order sequence
        const index = this.matchers.findIndex(m => m.match(pickleInQuestion));
        if (index === -1) {
            return RuleEvaluationResult.allowed('Pickle is not part of sequential order');
        }

        // If a matching pickle has already run → this is an error condition
        if (runnedPickles.some(p => this.matchers[index].match(p))) {
            return RuleEvaluationResult.blocked(
                `Pickle "${pickleInQuestion.name}" has already run, but was scheduled again.`,
                { sequentialPosition: index }
            );
        }

        // Check if previous matchers have completed
        for (let i = 0; i < index; i++) {
            const previousMatcher = this.matchers[i];

            // If any previous group scenario is still running → block
            if (runningPickles.some(p => previousMatcher.match(p))) {
                return RuleEvaluationResult.blocked(
                    `Cannot run: previous step ${i} is still running`,
                    { 
                        sequentialPosition: index,
                        waitingForStep: i,
                        runningPickles: runningPickles.filter(p => previousMatcher.match(p)).map(p => p.name)
                    }
                );
            }

            // If no scenario of that group has ever been run → also block
            const anyRanBefore = runnedPickles.some(p => previousMatcher.match(p));
            if (!anyRanBefore) {
                return RuleEvaluationResult.blocked(
                    `Cannot run: previous step ${i} has not completed yet`,
                    { 
                        sequentialPosition: index,
                        waitingForStep: i
                    }
                );
            }
        }

        return RuleEvaluationResult.allowed(
            `Ready to run: all previous steps completed`,
            { sequentialPosition: index }
        );
    }

    getMatchers(): IPickleMatcher[] {
        return this.matchers;
    }

    public toString(): string {
        return `SequentialSingleMatchRule(order: [${this.matchers}])`;
    }
}
