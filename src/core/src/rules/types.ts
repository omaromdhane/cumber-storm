import { Pickle } from '@cucumber/messages';
import { IDisposable } from '../common/lifecycle';
import { IPickleMatcher } from '../matchers';
import { IEntity } from '../common/entity';
import { RuleEvaluationResult } from './evaluation_result';

/**
 * Represents a scheduling rule that determines whether a given test scenario (Pickle)
 * can be executed at a specific moment, based on the current execution state.
 *
 * Note: if disposed, the rule will behave as a pass all filter. It will retrun always true to every canRun request.
 */
export interface IPickleRule extends IDisposable, IEntity {
    name: string;
    
    /**
     * Determines whether a given scenario can be executed at this moment,
     * based on the current execution state.
     *
     * Implementations define different concurrency or ordering constraints.
     * If the rule has been disposed, this will always return true.
     *
     * @param pickleInQuestion - The scenario being considered for execution.
     * @param runningPickles - The list of scenarios that are currently running.
     * @param runnedPickles - The list of scenarios that have already finished running.
     * @returns `true` if the scenario can start running under the rule's constraints,
     *          `false` otherwise.
     */
    canRun(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        runnedPickles: Pickle[]
    ): boolean;
    
    /**
     * Evaluate if a pickle can run and return detailed information about the decision
     * This method provides rich information about why a pickle was allowed or blocked
     * 
     * @param pickleInQuestion - The scenario being considered for execution
     * @param runningPickles - The list of scenarios that are currently running
     * @param runnedPickles - The list of scenarios that have already finished running
     * @returns Detailed evaluation result with reasons and suggestions
     */
    evaluate(
        pickleInQuestion: Pickle,
        runningPickles: Pickle[],
        runnedPickles: Pickle[]
    ): RuleEvaluationResult;
    toString: () => string;
    getMatchers: () => IPickleMatcher[];
}
