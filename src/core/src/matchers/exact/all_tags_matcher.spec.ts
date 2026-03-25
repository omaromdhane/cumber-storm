import { expect } from "chai";
import { Pickle, PickleTag } from "@cucumber/messages";
import { ExactAllTagsMatcher } from "./all_tags_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("ExactAllTagsMatcher", () => {
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

    it("matches scenario with all specified tags", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke", "@critical"]);
        const pickle = createPickle(["@smoke", "@critical", "@api"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("does not match when missing one tag", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke", "@critical"]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("matches exact tag names only", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke"]);
        const pickle = createPickle(["@smoke-test"]);

        expect(matcher.match(pickle)).to.be.false;
    });

    it("matches with single tag", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke"]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("handles empty tag array", () => {
        const matcher = new ExactAllTagsMatcher([]);
        const pickle = createPickle(["@smoke"]);

        expect(matcher.match(pickle)).to.be.true;
    });

    it("has correct properties", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke"]);

        expect(matcher.level).to.equal(MatcherLevel.ALL_TAGS);
        expect(matcher.type).to.equal(MatcherType.EXACT);
        expect(matcher.id).to.match(/^exact-all-tag_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new ExactAllTagsMatcher(["@smoke", "@critical"]);
        const str = matcher.toString();

        expect(str).to.include("exact_");
        expect(str).to.include("@smoke");
        expect(str).to.include("@critical");
    });

    describe("ignoreCase option", () => {
        it("matches tags case-insensitively when ignoreCase is true", () => {
            const matcher = new ExactAllTagsMatcher(["@smoke", "@critical"], true);
            const pickle = createPickle(["@SMOKE", "@CRITICAL"]);

            expect(matcher.match(pickle)).to.be.true;
        });

        it("matches mixed case tags", () => {
            const matcher = new ExactAllTagsMatcher(["@smoke"], true);
            const pickle1 = createPickle(["@Smoke"]);
            const pickle2 = createPickle(["@SMOKE"]);
            const pickle3 = createPickle(["@smoke"]);

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
        });
    });
});
