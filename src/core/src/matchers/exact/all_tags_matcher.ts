import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class ExactAllTagsMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly tags: string[];
    private readonly ignoreCase: boolean;

    constructor(tags: string[], ignoreCase: boolean = false) {
        super('exact-all-tag');
        this.level = MatcherLevel.ALL_TAGS;
        this.type = MatcherType.EXACT;
        this.tags = tags;
        this.ignoreCase = ignoreCase;
        
        if (ignoreCase) {
            const lowerTags = tags.map(t => t.toLowerCase());
            this.match = (pickle: Pickle) => 
                lowerTags.every(tag => pickle.tags?.some(t => t.name.toLowerCase() === tag));
        } else {
            this.match = (pickle: Pickle) => 
                tags.every(tag => pickle.tags?.some(t => t.name === tag));
        }
    }

    public getPattern(): string {
        const ignoreCaseStr = this.ignoreCase ? ' (ignoreCase)' : '';
        return `allTags: [${this.tags.join(', ')}]${ignoreCaseStr}`;
    }

    public toString(): string {
        const ignoreCaseStr = this.ignoreCase ? ', ignoreCase: true' : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ tags: [${this.tags.join(', ')}]${ignoreCaseStr} })`;
    }
}
