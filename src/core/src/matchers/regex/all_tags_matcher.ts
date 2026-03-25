import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, IRegexOptions, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class RegexAllTagsMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly tagPatterns: string[];
    private readonly regexOptions?: IRegexOptions;

    constructor(tagPatterns: string[], regexOptions?: IRegexOptions) {
        super('regex-all-tag');
        this.level = MatcherLevel.ALL_TAGS;
        this.type = MatcherType.REGEX;
        this.tagPatterns = tagPatterns;
        this.regexOptions = regexOptions;
        
        const regexes = tagPatterns.map(pattern => new RegExp(pattern, this.getRegexFlags(regexOptions)));
        this.match = (pickle: Pickle) => regexes.every(regex => pickle.tags?.some(t => regex.test(t.name)));
    }

    private getRegexFlags(regexOptions?: IRegexOptions): string {
        let flags = '';
        if (!regexOptions) {
            return flags;
        }
        if (regexOptions.caseInsensitive) flags += 'i';
        if (regexOptions.multiline) flags += 'm';
        if (regexOptions.dotAll) flags += 's';
        if (regexOptions.unicode) flags += 'u';
        return flags;
    }

    public getPattern(): string {
        const flags = this.getRegexFlags(this.regexOptions);
        return `allTags: [${this.tagPatterns.join(', ')}]${flags ? ` (flags: ${flags})` : ''}`;
    }

    public toString(): string {
        const optionsStr = this.regexOptions 
            ? `, regexOptions: ${JSON.stringify(this.regexOptions)}` 
            : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ tagPatterns: [${this.tagPatterns.join(', ')}]${optionsStr} })`;
    }
}
