import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class ExactUriMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly uri: string;
    private readonly ignoreCase: boolean;

    constructor(uri: string, ignoreCase: boolean = false) {
        super('exact-uri');
        this.level = MatcherLevel.URI;
        this.type = MatcherType.EXACT;
        this.uri = uri;
        this.ignoreCase = ignoreCase;
        
        if (ignoreCase) {
            const lowerUri = uri.toLowerCase();
            this.match = (pickle: Pickle) => pickle.uri.toLowerCase() === lowerUri;
        } else {
            this.match = (pickle: Pickle) => pickle.uri === uri;
        }
    }

    public getPattern(): string {
        const ignoreCaseStr = this.ignoreCase ? ' (ignoreCase)' : '';
        return `uri: "${this.uri}"${ignoreCaseStr}`;
    }

    public toString(): string {
        const ignoreCaseStr = this.ignoreCase ? ', ignoreCase: true' : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ uri: ${this.uri}${ignoreCaseStr} })`;
    }
}
