import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class ExactFileNameMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly fileName: string;
    private readonly ignoreCase: boolean;

    constructor(fileName: string, ignoreCase: boolean = false) {
        super('exact-file');
        this.level = MatcherLevel.FEATURE_FILE_NAME;
        this.type = MatcherType.EXACT;
        this.fileName = fileName;
        this.ignoreCase = ignoreCase;
        
        if (ignoreCase) {
            const lowerFileName = fileName.toLowerCase();
            this.match = (pickle: Pickle) => {
                const parts = pickle.uri.split('/');
                const featureFileName = parts[parts.length - 1];
                return featureFileName.toLowerCase() === lowerFileName;
            };
        } else {
            this.match = (pickle: Pickle) => {
                const parts = pickle.uri.split('/');
                const featureFileName = parts[parts.length - 1];
                return featureFileName === fileName;
            };
        }
    }

    public getPattern(): string {
        const ignoreCaseStr = this.ignoreCase ? ' (ignoreCase)' : '';
        return `fileName: "${this.fileName}"${ignoreCaseStr}`;
    }

    public toString(): string {
        const ignoreCaseStr = this.ignoreCase ? ', ignoreCase: true' : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ fileName: ${this.fileName}${ignoreCaseStr} })`;
    }
}
