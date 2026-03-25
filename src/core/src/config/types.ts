import { IPickleRule } from "../rules";

export interface IUserConfig {
    rules: IRuleDefinition[];
}

export enum MatchingStrategy {
    EXACT = 'exact',
    REGEX = 'regex',
    // GLOB = 'glob' // to be implemented
}

export interface IMatcherOptions {
    ignoreCase?: boolean;
    strategy?: MatchingStrategy;
}

export interface IMatcherDefinition {
    scenarioName?: string;
    allTags?: string[];
    anyTag?: string[];
    uri?: string;
    featureFileName?: string;
    options?: IMatcherOptions;
}

export interface IExclusiveRuleDefinition {
    type: "exclusive";
    groups: IMatcherDefinition[];
}

export interface IMaxConcurrentRuleDefinition {
    type: "max-concurrent";
    max: number;
    match: IMatcherDefinition;
}

export interface ISequentialRuleDefinition {
    type: "sequential";
    order: IMatcherDefinition[];
}

export type IRuleDefinition = 
    | IExclusiveRuleDefinition 
    | IMaxConcurrentRuleDefinition 
    | ISequentialRuleDefinition;

/**
 * Flattened configuration ready for execution.
 */
export interface IFlattenedConfig {
    rules: IPickleRule[];
}
