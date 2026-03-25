import { expect } from "chai";
import { Pickle } from "@cucumber/messages";
import { ExactFileNameMatcher } from "./file_name_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("ExactFileNameMatcher", () => {
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

    it("matches scenario by exact file name", () => {
        const matcher = new ExactFileNameMatcher("login.feature");
        const pickle = createPickle("features/auth/login.feature");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("does not match partial file name", () => {
        const matcher = new ExactFileNameMatcher("login");
        const pickle = createPickle("features/auth/login.feature");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("is case-sensitive", () => {
        const matcher = new ExactFileNameMatcher("Login.feature");
        const pickle = createPickle("features/auth/login.feature");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("only matches file name, not path", () => {
        const matcher = new ExactFileNameMatcher("login.feature");
        const pickle1 = createPickle("features/auth/login.feature");
        const pickle2 = createPickle("features/api/login.feature");
        const pickle3 = createPickle("login.feature");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.true;
    });

    it("has correct properties", () => {
        const matcher = new ExactFileNameMatcher("test.feature");

        expect(matcher.level).to.equal(MatcherLevel.FEATURE_FILE_NAME);
        expect(matcher.type).to.equal(MatcherType.EXACT);
        expect(matcher.id).to.match(/^exact-file_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new ExactFileNameMatcher("login.feature");
        const str = matcher.toString();

        expect(str).to.include("exact_");
        expect(str).to.include("login.feature");
    });

    describe("ignoreCase option", () => {
        it("matches file name case-insensitively when ignoreCase is true", () => {
            const matcher = new ExactFileNameMatcher("login.feature", true);
            const pickle1 = createPickle("features/auth/login.feature");
            const pickle2 = createPickle("features/auth/LOGIN.FEATURE");
            const pickle3 = createPickle("features/auth/Login.Feature");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
        });

        it("is case-sensitive when ignoreCase is false", () => {
            const matcher = new ExactFileNameMatcher("login.feature", false);
            const pickle = createPickle("features/auth/Login.Feature");

            expect(matcher.match(pickle)).to.be.false;
        });
    });
});
