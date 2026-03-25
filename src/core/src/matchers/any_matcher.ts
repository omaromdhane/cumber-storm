import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, MatcherFunction, MatcherLevel, MatcherType } from "./types";
import { Entity } from "../common/entity";

export class AnyMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;

    private constructor(level: MatcherLevel, match: MatcherFunction) {
        super('any-matcher');
        this.level = level;
        this.match = match;
        this.type = MatcherType.ANY;
    }

    public getPattern(): string {
        return '*';
    }

    public toString(): string {
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level})`;
    }

    public static newAnyPickle(): AnyMatcher {
        return new AnyMatcher(
            MatcherLevel.ANY_PICKLE,
            (_pickle: Pickle) => true
        );
    }
}
