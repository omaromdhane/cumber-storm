import { IUserConfig, IFlattenedConfig, IRuleDefinition, IExclusiveRuleDefinition, IMaxConcurrentRuleDefinition, ISequentialRuleDefinition, IMatcherDefinition, MatchingStrategy } from './types';
import { IPickleRule, ExclusiveRule, MaxConcurrentRule, SequentialSingleMatchRule } from '../rules';
import { 
    IPickleMatcher,
    ExactScenarioNameMatcher,
    ExactAllTagsMatcher,
    ExactAnyTagMatcher,
    ExactUriMatcher,
    ExactFileNameMatcher,
    RegexScenarioNameMatcher,
    RegexAllTagsMatcher,
    RegexAnyTagMatcher,
    RegexUriMatcher,
    RegexFileNameMatcher
} from "../matchers";
import logger from '../common/logger';

/**
 * Creates a flattened config from an existing IConfig
 * 
 * @param config - IConfig instance
 * @returns Flattened configuration
 */
export function flattenUserConfig(userConfig: IUserConfig): IFlattenedConfig {
    const flattenedRules: IPickleRule[] = createRulesFromConfig(userConfig.rules);
    logger.debug(`loaded rules: ${flattenedRules}`)
    return {
        rules: flattenedRules
    };
};

function createRulesFromConfig(ruleConfigs: any[]): IPickleRule[] {
    return ruleConfigs.map(config => createRule(config));
}

// Build matcher function
function createMatcherFromDefinition(def: IMatcherDefinition): IPickleMatcher {
    const matchers: IPickleMatcher[] = [];
    const strategy = def.options?.strategy || MatchingStrategy.REGEX;
    const ignoreCase = def.options?.ignoreCase || false;
    // Prepare regex options
    const regexOptions = ignoreCase ? { caseInsensitive: true } : undefined;

    // Scenario name
    if (def.scenarioName) {
        if (strategy === MatchingStrategy.EXACT) {
            matchers.push(new ExactScenarioNameMatcher(def.scenarioName, ignoreCase));
        } else if (strategy === MatchingStrategy.REGEX) {
            matchers.push(new RegexScenarioNameMatcher(def.scenarioName, regexOptions));
        }
    }

    // Tags (AND)
    if (def.allTags) {
        if (strategy === MatchingStrategy.EXACT) {
            matchers.push(new ExactAllTagsMatcher(def.allTags, ignoreCase));
        } else if (strategy === MatchingStrategy.REGEX) {
            matchers.push(new RegexAllTagsMatcher(def.allTags, regexOptions));
        }
    }

    // Tags (OR)
    if (def.anyTag) {
        if (strategy === MatchingStrategy.EXACT) {
            matchers.push(new ExactAnyTagMatcher(def.anyTag, ignoreCase));
        } else if (strategy === MatchingStrategy.REGEX) {
            matchers.push(new RegexAnyTagMatcher(def.anyTag, regexOptions));
        }
    }

    if (def.uri) {
        if (strategy === MatchingStrategy.EXACT) {
            matchers.push(new ExactUriMatcher(def.uri, ignoreCase));
        } else if (strategy === MatchingStrategy.REGEX) {
            matchers.push(new RegexUriMatcher(def.uri, regexOptions));
        }
    }

    if (def.featureFileName) {
        if (strategy === MatchingStrategy.EXACT) {
            matchers.push(new ExactFileNameMatcher(def.featureFileName, ignoreCase));
        } else if (strategy === MatchingStrategy.REGEX) {
            matchers.push(new RegexFileNameMatcher(def.featureFileName, regexOptions));
        }
    }

    if (matchers.length === 0) {
        throw new Error(
            `No matcher could be built from the definition. Matcher definition must specify exactly one field, but found ${matchers.length}`
        );
    }
    if (matchers.length > 1) {
        throw new Error(
            `Matcher definition must specify exactly one field, but found ${matchers.length}: ` +
            `${['scenarioName', 'allTags', 'anyTag', 'uri', 'featureFileName'].filter(f => (def as any)[f] !== undefined).join(', ')}`
        );
    }
    return matchers[0];
}

function createRule(config: IRuleDefinition): IPickleRule {
    switch (config.type) {
        case 'exclusive':
            return createExclusiveRule(config);
        case 'max-concurrent':
            return createMaxConcurrentRule(config);
        case 'sequential':
            return createSequentialRule(config);
        default:
            throw new Error(`Unknown rule type: ${(config as any).type}`);
    }
}

function createExclusiveRule(config: IExclusiveRuleDefinition): IPickleRule {
    const matchers = config.groups.map(group => createMatcherFromDefinition(group));
    const rule = new ExclusiveRule(matchers);
    // Add type property for tracking
    (rule as any).type = 'exclusive';
    return rule;
}

function createMaxConcurrentRule(config: IMaxConcurrentRuleDefinition): IPickleRule {
    const matcher = createMatcherFromDefinition(config.match);
    const rule = new MaxConcurrentRule(config.max, matcher);
    // Add type property for tracking
    (rule as any).type = 'max-concurrent';
    return rule;
}

function createSequentialRule(config: ISequentialRuleDefinition): IPickleRule {
    const matchers = config.order.map(order => createMatcherFromDefinition(order));
    const rule = new SequentialSingleMatchRule(matchers);
    // Add type property for tracking
    (rule as any).type = 'sequential';
    return rule;
}
