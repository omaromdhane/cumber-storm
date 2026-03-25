import { Pickle } from "@cucumber/messages";
import { IPickleMatcher, MatcherFunction, MatcherLevel, MatcherType } from "../types";
import { Entity } from "../../common/entity";

export class ExactScenarioNameMatcher extends Entity implements IPickleMatcher {
    public readonly level: MatcherLevel;
    public readonly type: MatcherType;
    public readonly match: MatcherFunction;
    private readonly scenarioName: string;
    private readonly ignoreCase: boolean;

    constructor(scenarioName: string, ignoreCase: boolean = false) {
        super('exact-scenario');
        this.level = MatcherLevel.SCENARIO_NAME;
        this.type = MatcherType.EXACT;
        this.scenarioName = scenarioName;
        this.ignoreCase = ignoreCase;
        
        if (ignoreCase) {
            const lowerName = scenarioName.toLowerCase();
            this.match = (pickle: Pickle) => pickle.name.toLowerCase() === lowerName;
        } else {
            this.match = (pickle: Pickle) => pickle.name === scenarioName;
        }
    }

    public getPattern(): string {
        const ignoreCaseStr = this.ignoreCase ? ' (ignoreCase)' : '';
        return `scenarioName: "${this.scenarioName}"${ignoreCaseStr}`;
    }

    public toString(): string {
        const ignoreCaseStr = this.ignoreCase ? ', ignoreCase: true' : '';
        return `Matcher(id=${this.id}, type=${this.type}, level=${this.level}, options={ scenarioName: ${this.scenarioName}${ignoreCaseStr} })`;
    }
}
