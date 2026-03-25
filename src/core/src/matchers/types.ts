import { Pickle } from "@cucumber/messages";
import { IEntity } from "../common/entity";

export type MatcherFunction = (candidate: Pickle) => boolean

export enum MatcherLevel {
    SCENARIO_NAME = 'scenario_name',
    ALL_TAGS = 'tags',
    ANY_TAG = 'any_tag',
    FEATURE_FILE_NAME = 'feature_file_name',
    URI = 'uri',
    ANY_PICKLE = 'any_pickle',
    CUSTOM = 'custom'
}

export enum MatcherType {
    REGEX = 'regex_matcher',
    EXACT = 'exact_matcher',
    ANY = 'any_matcher'
}

export interface IRegexOptions {
    caseInsensitive?: boolean;
    multiline?: boolean;
    dotAll?: boolean;
    unicode?: boolean;
}

export interface IPickleMatcher extends IEntity {
    level: MatcherLevel;
    type: MatcherType;
    match: MatcherFunction;
    toString: () => string;
    /** Returns a human-readable description of the pattern this matcher uses */
    getPattern: () => string;
}