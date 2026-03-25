import { IPickleRule, RuleEvaluationResult } from '../rules';
import { Pickle } from '@cucumber/messages';

export enum Events {    
    // Rule Events
    SET_PARALLEL_DEMAND = 'set_parallel_demand',
    
    // Execution Events
    WORKER_STARTED = 'worker_started',
    WORKER_ERROR = 'worker_error',
    WORKER_WARNING = 'worker_warning',
    WORKER_FINISHED = 'worker_finished',
}

export interface IBaseEventData {}

export interface IErrorEventData extends IBaseEventData {
    error: string;
}

export interface ISetParallelDemandEventData extends IBaseEventData {
    candidate: Pickle;
    runningPickles: Pickle[];
    runnedPickles: Pickle[];
    rules_results: {
        rule: IPickleRule;
        result: RuleEvaluationResult;
    }[];
}
