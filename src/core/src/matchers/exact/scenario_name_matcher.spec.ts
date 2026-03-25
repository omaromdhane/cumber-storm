import { expect } from "chai";
import { Pickle, PickleTag } from "@cucumber/messages";
import { ExactScenarioNameMatcher } from "./scenario_name_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("ExactScenarioNameMatcher", () => {
    const createPickle = (name: string, uri: string = "test.feature"): Pickle => {
        return {
            id: "test-id",
            name,
            uri,
            tags: [],
            astNodeIds: [],
            language: "en",
            steps: []
        };
    };

    it("matches scenario by exact name", () => {
        const matcher = new ExactScenarioNameMatcher("Login test");
        const pickle = createPickle("Login test");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("does not match partial name", () => {
        const matcher = new ExactScenarioNameMatcher("Login");
        const pickle = createPickle("Login test");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("is case-sensitive", () => {
        const matcher = new ExactScenarioNameMatcher("Login test");
        const pickle = createPickle("login test");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new ExactScenarioNameMatcher("Test");

        expect(matcher.level).to.equal(MatcherLevel.SCENARIO_NAME);
        expect(matcher.type).to.equal(MatcherType.EXACT);
        expect(matcher.id).to.match(/^exact-scenario_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new ExactScenarioNameMatcher("Login test");
        const str = matcher.toString();

        expect(str).to.include("exact_");
        expect(str).to.include("exact_matcher");
        expect(str).to.include("scenario_name");
        expect(str).to.include("Login test");
    });

    it("generates unique IDs", () => {
        const matcher1 = new ExactScenarioNameMatcher("Test1");
        const matcher2 = new ExactScenarioNameMatcher("Test2");

        expect(matcher1.id).to.not.equal(matcher2.id);
    });

    describe("ignoreCase option", () => {
        it("matches case-insensitively when ignoreCase is true", () => {
            const matcher = new ExactScenarioNameMatcher("Login test", true);
            const pickle1 = createPickle("Login test");
            const pickle2 = createPickle("LOGIN TEST");
            const pickle3 = createPickle("login test");
            const pickle4 = createPickle("LoGiN TeSt");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
            expect(matcher.match(pickle4)).to.be.true;
        });

        it("is case-sensitive when ignoreCase is false", () => {
            const matcher = new ExactScenarioNameMatcher("Login test", false);
            const pickle1 = createPickle("Login test");
            const pickle2 = createPickle("login test");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.false;
        });

        it("includes ignoreCase in toString when true", () => {
            const matcher = new ExactScenarioNameMatcher("Login test", true);
            const str = matcher.toString();

            expect(str).to.include("ignoreCase: true");
        });
    });
});
