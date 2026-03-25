import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, IRegexOptions, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class RegexUriMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly pattern: string;
    private readonly regexOptions?: IRegexOptions;

    constructor(pattern: string, regexOptions?: IRegexOptions) {
        super('regex-uri');
        this.level = MatcherLevel.URI;
        this.type = MatcherType.REGEX;
        this.pattern = pattern;
        this.regexOptions = regexOptions;
        
        const regex = new RegExp(pattern, this.getRegexFlags(regexOptions));
        this.match = (pickle: Pickle) => regex.test(pickle.uri);
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
        return `uri: "${this.pattern}"${flags ? ` (flags: ${flags})` : ''}`;
    }

    public toString(): string {
        const optionsStr = this.regexOptions 
            ? `, regexOptions: ${JSON.stringify(this.regexOptions)}` 
            : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ pattern: ${this.pattern}${optionsStr} })`;
    }
}
