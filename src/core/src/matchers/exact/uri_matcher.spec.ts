import { expect } from "chai";
import { Pickle } from "@cucumber/messages";
import { ExactUriMatcher } from "./uri_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("ExactUriMatcher", () => {
    const createPickle = (uri: string): Pickle => {
        return {
            id: "test-id",
            name: "Test",
            uri,
            tags: [],
            astNodeIds: [],
            language: "en",
            steps: []
        };
    };

    it("matches scenario by exact URI", () => {
        const matcher = new ExactUriMatcher("features/login.feature");
        const pickle = createPickle("features/login.feature");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("does not match partial URI", () => {
        const matcher = new ExactUriMatcher("login.feature");
        const pickle = createPickle("features/login.feature");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("is case-sensitive", () => {
        const matcher = new ExactUriMatcher("features/Login.feature");
        const pickle = createPickle("features/login.feature");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new ExactUriMatcher("test.feature");

        expect(matcher.level).to.equal(MatcherLevel.URI);
        expect(matcher.type).to.equal(MatcherType.EXACT);
        expect(matcher.id).to.match(/^exact-uri_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new ExactUriMatcher("features/login.feature");
        const str = matcher.toString();

        expect(str).to.include("exact_");
        expect(str).to.include("features/login.feature");
    });

    describe("ignoreCase option", () => {
        it("matches URI case-insensitively when ignoreCase is true", () => {
            const matcher = new ExactUriMatcher("features/login.feature", true);
            const pickle1 = createPickle("features/login.feature");
            const pickle2 = createPickle("FEATURES/LOGIN.FEATURE");
            const pickle3 = createPickle("Features/Login.Feature");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
        });

        it("is case-sensitive when ignoreCase is false", () => {
            const matcher = new ExactUriMatcher("features/login.feature", false);
            const pickle = createPickle("Features/Login.Feature");

            expect(matcher.match(pickle)).to.be.false;
        });
    });
});
