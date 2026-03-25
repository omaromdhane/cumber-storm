import { expect } from "chai";
import { Pickle, PickleTag } from "@cucumber/messages";
import { RegexAllTagsMatcher } from "./all_tags_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("RegexAllTagsMatcher", () => {
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
        const matcher = new RegexAllTagsMatcher(["@smoke.*", "@critical"]);
        const pickle = createPickle(["@smoke-test", "@critical"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("does not match when one pattern fails", () => {
        const matcher = new RegexAllTagsMatcher(["@smoke.*", "@critical"]);
        const pickle = createPickle(["@smoke-test"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("supports case-insensitive tag matching", () => {
        const matcher = new RegexAllTagsMatcher(["@smoke"], { caseInsensitive: true });
        const pickle = createPickle(["@SMOKE", "@Smoke"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("matches complex tag patterns", () => {
        const matcher = new RegexAllTagsMatcher(["@(smoke|regression)", "@priority-\\d+"]);
        const pickle = createPickle(["@smoke", "@priority-1"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("handles empty tag array", () => {
        const matcher = new RegexAllTagsMatcher([]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("has correct properties", () => {
        const matcher = new RegexAllTagsMatcher(["@smoke"]);

        expect(matcher.level).to.equal(MatcherLevel.ALL_TAGS);
        expect(matcher.type).to.equal(MatcherType.REGEX);
        expect(matcher.id).to.match(/^regex-all-tag_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new RegexAllTagsMatcher(["@smoke", "@critical"]);
        const str = matcher.toString();

        expect(str).to.include("regex_");
        expect(str).to.include("@smoke");
        expect(str).to.include("@critical");
    });
});
