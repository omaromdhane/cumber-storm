import { expect } from "chai";
import { Pickle } from "@cucumber/messages";
import { RegexScenarioNameMatcher } from "./scenario_name_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("RegexScenarioNameMatcher", () => {
    const createPickle = (name: string): Pickle => {
        return {
            id: "test-id",
            name,
            uri: "test.feature",
            tags: [],
            astNodeIds: [],
            language: "en",
            steps: []
        };
    };

    it("matches scenario by regex pattern", () => {
        const matcher = new RegexScenarioNameMatcher("Login.*");
        const pickle1 = createPickle("Login test");
        const pickle2 = createPickle("Login with valid credentials");
        const pickle3 = createPickle("Logout test");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.false;
    });

    it("is case-sensitive by default", () => {
        const matcher = new RegexScenarioNameMatcher("Login");
        const pickle1 = createPickle("Login");
        const pickle2 = createPickle("login");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.false;
    });

    it("supports case-insensitive matching", () => {
        const matcher = new RegexScenarioNameMatcher("login", { caseInsensitive: true });
        const pickle1 = createPickle("Login");
        const pickle2 = createPickle("LOGIN");
        const pickle3 = createPickle("login");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.true;
    });

    it("supports multiline matching", () => {
        const matcher = new RegexScenarioNameMatcher("^Login", { multiline: true });
        const pickle = createPickle("Test\nLogin");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("supports unicode flag", () => {
        const matcher = new RegexScenarioNameMatcher("\\p{L}+", { unicode: true });
        const pickle = createPickle("Тест");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("has correct properties", () => {
        const matcher = new RegexScenarioNameMatcher("test");

        expect(matcher.level).to.equal(MatcherLevel.SCENARIO_NAME);
        expect(matcher.type).to.equal(MatcherType.REGEX);
        expect(matcher.id).to.match(/^regex-scenario_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new RegexScenarioNameMatcher("login", { caseInsensitive: true });
        const str = matcher.toString();

        expect(str).to.include("regex_");
        expect(str).to.include("login");
        expect(str).to.include("caseInsensitive");
    });

    it("generates unique IDs", () => {
        const matcher1 = new RegexScenarioNameMatcher("test1");
        const matcher2 = new RegexScenarioNameMatcher("test2");

        expect(matcher1.id).to.not.equal(matcher2.id);
    });
});
