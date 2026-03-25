import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, IRegexOptions, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class RegexScenarioNameMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly pattern: string;
    private readonly regexOptions?: IRegexOptions;

    constructor(pattern: string, regexOptions?: IRegexOptions) {
        super('regex-scenario');
        this.level = MatcherLevel.SCENARIO_NAME;
        this.type = MatcherType.REGEX;
        this.pattern = pattern;
        this.regexOptions = regexOptions;
        
        const regex = new RegExp(pattern, this.getRegexFlags(regexOptions));
        this.match = (pickle: Pickle) => regex.test(pickle.name);
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
        return `scenarioName: "${this.pattern}"${flags ? ` (flags: ${flags})` : ''}`;
    }

    public toString(): string {
        const optionsStr = this.regexOptions 
            ? `, regexOptions: ${JSON.stringify(this.regexOptions)}` 
            : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ pattern: ${this.pattern}${optionsStr} })`;
    }
}
