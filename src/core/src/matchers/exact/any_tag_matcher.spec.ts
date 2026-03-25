import { expect } from "chai";
import { Pickle, PickleTag } from "@cucumber/messages";
import { ExactAnyTagMatcher } from "./any_tag_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("ExactAnyTagMatcher", () => {
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

    it("matches scenario with any of the specified tags", () => {
        const matcher = new ExactAnyTagMatcher(["@smoke", "@critical"]);
        const pickle1 = createPickle(["@smoke"]);
        const pickle2 = createPickle(["@critical"]);
        const pickle3 = createPickle(["@smoke", "@critical"]);

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.true;
    });

    it("does not match when no matching tags", () => {
        const matcher = new ExactAnyTagMatcher(["@smoke", "@critical"]);
        const pickle = createPickle(["@regression"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("matches exact tag names only", () => {
        const matcher = new ExactAnyTagMatcher(["@smoke"]);
        const pickle = createPickle(["@smoke-test"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("handles empty tag array", () => {
        const matcher = new ExactAnyTagMatcher([]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new ExactAnyTagMatcher(["@smoke"]);

        expect(matcher.level).to.equal(MatcherLevel.ANY_TAG);
        expect(matcher.type).to.equal(MatcherType.EXACT);
        expect(matcher.id).to.match(/^exact-any-tag_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new ExactAnyTagMatcher(["@smoke", "@critical"]);
        const str = matcher.toString();

        expect(str).to.include("exact_");
        expect(str).to.include("@smoke");
        expect(str).to.include("@critical");
    });

    describe("ignoreCase option", () => {
        it("matches tags case-insensitively when ignoreCase is true", () => {
            const matcher = new ExactAnyTagMatcher(["@smoke"], true);
            const pickle = createPickle(["@SMOKE"]);

            expect(matcher.match(pickle)).to.be.true;
        });

        it("matches any tag with mixed case", () => {
            const matcher = new ExactAnyTagMatcher(["@smoke", "@critical"], true);
            const pickle1 = createPickle(["@Smoke"]);
            const pickle2 = createPickle(["@CRITICAL"]);

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
        });
    });
});
