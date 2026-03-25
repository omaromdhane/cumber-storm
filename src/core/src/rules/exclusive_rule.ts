import { Pickle } from '@cucumber/messages';
import { IPickleRule } from "./types";
import { IPickleMatcher } from '../matchers';
import { DisposableEntity } from '../common/entity';
import { RuleEvaluationResult } from './evaluation_result';

// Ensures that scenarios matching one group of matchers
// cannot run in parallel with scenarios of other groups
export class ExclusiveRule extends DisposableEntity implements IPickleRule {
    public readonly name: string = 'ExclusiveRule';
    private matchers: IPickleMatcher[];

    constructor(matchers: IPickleMatcher[]) {
        super('excl-rule');
        this.matchers = matchers;
    }

    canRun(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        _runnedPickles: Pickle[]
    ): boolean {
        if (this._isDisposed) return true;
        let pickleInQuestionMatcherIndex = -1;

        // Find which matcher group the pickle belongs to
        for (let i = 0; i < this.matchers.length; i++) {
            if (this.matchers[i].match(pickleInQuestion)) {
                pickleInQuestionMatcherIndex = i;
                break;
            }
        }

        if (pickleInQuestionMatcherIndex === -1) return true;

        // If any currently running pickle matches a *different* matcher group → block
        for (let i = 0; i < this.matchers.length; i++) {
            if (i === pickleInQuestionMatcherIndex) continue;
            const matcher = this.matchers[i];
            if (runningPickles.some(r => matcher.match(r))) {
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
            return RuleEvaluationResult.allowed('Rule is disposed');
        }

        let pickleInQuestionMatcherIndex = -1;

        // Find which matcher group the pickle belongs to
        for (let i = 0; i < this.matchers.length; i++) {
            if (this.matchers[i].match(pickleInQuestion)) {
                pickleInQuestionMatcherIndex = i;
                break;
            }
        }

        if (pickleInQuestionMatcherIndex === -1) {
            return RuleEvaluationResult.allowed('Pickle is not part of any exclusive group');
        }

        // Check if any currently running pickle matches a *different* matcher group
        const conflictingGroups: number[] = [];
        const conflictingPickles: string[] = [];

        for (let i = 0; i < this.matchers.length; i++) {
            if (i === pickleInQuestionMatcherIndex) continue;
            const matcher = this.matchers[i];
            const conflicting = runningPickles.filter(r => matcher.match(r));
            if (conflicting.length > 0) {
                conflictingGroups.push(i);
                conflictingPickles.push(...conflicting.map(p => p.name));
            }
        }

        if (conflictingGroups.length > 0) {
            return RuleEvaluationResult.blocked(
                `Cannot run: exclusive conflict with group(s) ${conflictingGroups.join(', ')}`,
                {
                    exclusiveGroup: pickleInQuestionMatcherIndex,
                    conflictingGroups,
                    conflictingPickles
                }
            );
        }

        return RuleEvaluationResult.allowed(
            `Ready to run: no exclusive conflicts`,
            { exclusiveGroup: pickleInQuestionMatcherIndex }
        );
    }

    getMatchers(): IPickleMatcher[] {
        return this.matchers;
    }

    public toString(): string {
        return `ExclusiveRule(groups: [${this.matchers}])`;
    }
}