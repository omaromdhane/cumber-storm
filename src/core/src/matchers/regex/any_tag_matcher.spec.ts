import { expect } from "chai";
import { Pickle, PickleTag } from "@cucumber/messages";
import { RegexAnyTagMatcher } from "./any_tag_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("RegexAnyTagMatcher", () => {
    const createPickle = (tags: string[]): Pickle => {
        return {
            id: "test-id",
            name: "Test",
            uri: "test.feature",
            tags: tags.map(tag => ({ 
                name: tag,
                astNodeId: "ast-node-id"
            } as PickleTag)),
            astNodeIds: [],
            language: "en",
            steps: []
        };
    };

    it("matches tags with regex patterns", () => {
        const matcher = new RegexAnyTagMatcher(["@smoke.*", "@critical.*"]);
        const pickle1 = createPickle(["@smoke-test"]);
        const pickle2 = createPickle(["@critical-bug"]);
        const pickle3 = createPickle(["@regression"]);

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.false;
    });

    it("supports case-insensitive tag matching", () => {
        const matcher = new RegexAnyTagMatcher(["@smoke"], { caseInsensitive: true });
        const pickle = createPickle(["@SMOKE"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("matches with any pattern", () => {
        const matcher = new RegexAnyTagMatcher(["@smoke", "@critical"]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("handles empty tag array", () => {
        const matcher = new RegexAnyTagMatcher([]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new RegexAnyTagMatcher(["@smoke"]);

        expect(matcher.level).to.equal(MatcherLevel.ANY_TAG);
        expect(matcher.type).to.equal(MatcherType.REGEX);
        expect(matcher.id).to.match(/^regex-any-tag_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new RegexAnyTagMatcher(["@smoke", "@critical"]);
        const str = matcher.toString();

        expect(str).to.include("regex_");
        expect(str).to.include("@smoke");
        expect(str).to.include("@critical");
    });
});
