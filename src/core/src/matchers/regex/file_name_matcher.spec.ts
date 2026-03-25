import { expect } from "chai";
import { Pickle } from "@cucumber/messages";
import { RegexFileNameMatcher } from "./file_name_matcher";
import { MatcherLevel, MatcherType } from "../types";

describe("RegexFileNameMatcher", () => {
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

    it("matches file name by regex pattern", () => {
        const matcher = new RegexFileNameMatcher("login.*");
        const pickle1 = createPickle("features/auth/login.feature");
        const pickle2 = createPickle("features/auth/login-page.feature");
        const pickle3 = createPickle("features/auth/logout.feature");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.true;
        expect(matcher.match(pickle3)).to.be.false;
    });

    it("supports case-insensitive file name matching", () => {
        const matcher = new RegexFileNameMatcher("LOGIN", { caseInsensitive: true });
        const pickle = createPickle("features/auth/login.feature");

        expect(matcher.match(pickle)).to.be.true;
    });

    it("only matches file name, not full path", () => {
        const matcher = new RegexFileNameMatcher("login");
        const pickle = createPickle("login/logout.feature");

        expect(matcher.match(pickle)).to.be.false;
    });

    it("matches with wildcards", () => {
        const matcher = new RegexFileNameMatcher(".*\\.feature");
        const pickle1 = createPickle("features/test.feature");
        const pickle2 = createPickle("features/test.txt");

        expect(matcher.match(pickle1)).to.be.true;
        expect(matcher.match(pickle2)).to.be.false;
    });

    it("has correct properties", () => {
        const matcher = new RegexFileNameMatcher("test");

        expect(matcher.level).to.equal(MatcherLevel.FEATURE_FILE_NAME);
        expect(matcher.type).to.equal(MatcherType.REGEX);
        expect(matcher.id).to.match(/^regex-file_\d+$/);
    });

    it("has correct toString", () => {
        const matcher = new RegexFileNameMatcher("login.*");
        const str = matcher.toString();

        expect(str).to.include("regex_");
        expect(str).to.include("login.*");
    });
});
