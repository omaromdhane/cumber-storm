import { setParallelCanAssign } from '@cucumber/cucumber';
import { IPickleRule } from '@/src/rules/types';
import { PickleTracker } from '../execution/pickle_tracker';
import { Pickle } from '@cucumber/messages';
import logger from '../common/logger';
import { Events } from '../events/types';
import { Disposable } from '../common/lifecycle';
import { CumberEvent, globalPubsub } from '../events';

/**
 * ParallelExecutionScheduler manages the parallel execution of Cucumber tests
 * by applying scheduling rules that control when tests can run.
 * 
 * It integrates with Cucumber's parallel execution API and uses a PickleTracker
 * to maintain execution state, enabling intelligent scheduling decisions based on
 * which tests are running and which have completed.
 */
export class ParallelExecutionScheduler extends Disposable {
    private setParallelCanRun: typeof setParallelCanAssign;
    private rules: IPickleRule[] = [];
    private tracker: PickleTracker = new PickleTracker();
    private checkAllRules: boolean = true;

    constructor(set: typeof setParallelCanAssign, rules: IPickleRule[]) {
        super();
        this.setParallelCanRun = set;
        this.rules = rules;
    }

    /**
     * Apply scheduling rules to Cucumber's parallel execution.
     * This method registers a callback with Cucumber that evaluates all rules
     * before allowing a test to start execution.
     * 
     * @throws {Error} If no rules are configured
     */
    applyRules(): void {
        logger.debug(`[ParallelExecutionScheduler] Applying cumberstorm rules to setParallelCanRun. Number of rules is: ${this.rules.length}`)

        this.setParallelCanRun((pickle: Pickle, runningPickles: Pickle[]) => {
            logger.debug('='.repeat(40))
            logger.debug(
                `[ParallelExecutionScheduler] canAssign request for pickle: {
                    id=${pickle.id},
                    uri=${pickle.uri},
                    tags=${pickle.tags.map(tag => tag.name)},
                    astNodeIds=${pickle.astNodeIds},
                `
            );

            logger.debug(
                `Running pickles (scenario names): ${this.formatPickleArray(runningPickles)}`
            );
            // Update tracker with currently running pickles
            this.tracker.registerRunning(runningPickles);
            const runnedPickles = this.tracker.getRunned();
            logger.debug(
                `Already run pickles (scenario names): ${this.formatPickleArray(runnedPickles)}`
            );
            
            // Evaluate rules
            const rules_results: { rule: IPickleRule, result: ReturnType<IPickleRule['evaluate']> }[] = [];
            let finalResult: boolean = true;
            for (const rule of this.rules) {
                const result = rule.evaluate(pickle, runningPickles, runnedPickles);
                logger.debug(
                    `${result.allowed ? "ACCEPTED" : "REFUSED"} by rule: ${rule.name ?? "(unnamed)"}`
                );
                rules_results.push({ rule, result });
                finalResult &&= result.allowed;
                if (!result.allowed && !this.checkAllRules) {
                    break;
                }
            }
            
            // Fire set parallel demand event
            globalPubsub.emit(
                Events.SET_PARALLEL_DEMAND,
                new CumberEvent({
                    candidate: pickle,
                    runningPickles,
                    runnedPickles,
                    rules_results: rules_results,
                })
            );
            
            logger.debug('='.repeat(40))
            return finalResult;
        });
    }

    /**
     * Get the internal PickleTracker instance.
     * Useful for testing and debugging.
     */
    getTracker(): PickleTracker {
        return this.tracker;
    }

    /**
     * Get the configured rules.
     */
    getRules(): readonly IPickleRule[] {
        return this.rules;
    }

    private formatPickle(pickle: Pickle): string {
        return pickle?.name ?? JSON.stringify(pickle);
    }

    private formatPickleArray(arr: Pickle[]): string {
        return `[${arr.map(p => this.formatPickle(p)).join(", ")}]`;
    }
}
