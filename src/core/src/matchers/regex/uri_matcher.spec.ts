import { expect } from "chai";
import { Pickle } from "@cucumber/messages";
import { RegexUriMatcher } from "./uri_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("RegexUriMatcher", () => {
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

    it("matches URI by regex pattern", () => {
        const matcher = new RegexUriMatcher(".*login.*\\.feature");
        const pickle1 = createPickle("features/login.feature");
        const pickle2 = createPickle("features/user-login.feature");
        const pickle3 = createPickle("features/logout.feature");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.false;
    });

    it("supports case-insensitive URI matching", () => {
        const matcher = new RegexUriMatcher("features/LOGIN", { caseInsensitive: true });
        const pickle = createPickle("features/login.feature");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("matches folder patterns", () => {
        const matcher = new RegexUriMatcher("features/(auth|api)");
        const pickle1 = createPickle("features/auth/login.feature");
        const pickle2 = createPickle("features/api/users.feature");
        const pickle3 = createPickle("features/database/users.feature");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new RegexUriMatcher("test");

        expect(matcher.level).to.equal(MatcherLevel.URI);
        expect(matcher.type).to.equal(MatcherType.REGEX);
        expect(matcher.id).to.match(/^regex-uri_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new RegexUriMatcher("features/.*", { caseInsensitive: true });
        const str = matcher.toString();

        expect(str).to.include("regex_");
        expect(str).to.include("features/.*");
    });
});
