import { expect } from "chai";
import { flattenUserConfig } from "./flattened_config";
import { IUserConfig, MatchingStrategy } from "./types";
import { Pickle } from "@cucumber/messages";

describe("flattenUserConfig", () => {
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

    describe("Matcher Options", () => {
        it("creates regex matcher by default", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login.*"
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            const rule = flattened.rules[0] as any;
            
            expect(rule.matcher.type).to.equal("regex_matcher");
        });

        it("creates exact matcher when strategy is exact", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login test",
                            options: {
                                strategy: MatchingStrategy.EXACT
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            const rule = flattened.rules[0] as any;
            
            expect(rule.matcher.type).to.equal("exact_matcher");
        });

        it("supports ignoreCase option with regex", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "login",
                            options: {
                                strategy: MatchingStrategy.REGEX,
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            const rule = flattened.rules[0] as any;
            const matcher = rule.matcher;
            
            const pickle1 = createPickle("Login");
            const pickle2 = createPickle("LOGIN");
            const pickle3 = createPickle("login");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
        });

        it("is case-sensitive by default", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login"
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            const rule = flattened.rules[0] as any;
            const matcher = rule.matcher;
            
            const pickle1 = createPickle("Login");
            const pickle2 = createPickle("login");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.false;
        });

        it("supports ignoreCase with exact strategy", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "login test",
                            options: {
                                strategy: MatchingStrategy.EXACT,
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            const rule = flattened.rules[0] as any;
            const matcher = rule.matcher;
            
            const pickle1 = createPickle("Login Test");
            const pickle2 = createPickle("LOGIN TEST");
            const pickle3 = createPickle("login test");

            expect(matcher.match(pickle1)).to.be.true;
            expect(matcher.match(pickle2)).to.be.true;
            expect(matcher.match(pickle3)).to.be.true;
        });
    });

    describe("Different Matcher Types", () => {
        it("creates matcher for tags with options", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            allTags: ["@smoke", "@critical"],
                            options: {
                                strategy: MatchingStrategy.EXACT
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            expect(flattened.rules).to.have.lengthOf(1);
        });

        it("creates matcher for anyTag with options", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            anyTag: ["@smoke", "@critical"],
                            options: {
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            expect(flattened.rules).to.have.lengthOf(1);
        });

        it("creates matcher for uri with options", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            uri: "features/login.feature",
                            options: {
                                strategy: MatchingStrategy.EXACT
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            expect(flattened.rules).to.have.lengthOf(1);
        });

        it("creates matcher for featureFileName with options", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            featureFileName: "login.feature",
                            options: {
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const flattened = flattenUserConfig(config);
            expect(flattened.rules).to.have.lengthOf(1);
        });
    });

    describe("Error Handling", () => {
        it("throws error when no matcher attribute is defined", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {}
                    }
                ]
            };

            expect(() => flattenUserConfig(config)).to.throw("No matcher could be built from the definition");
        });

        it("throws error when multiple matcher attributes are defined", () => {
            const config: IUserConfig = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login",
                            uri: "test.feature"
                        }
                    }
                ]
            };

            expect(() => flattenUserConfig(config)).to.throw("Matcher definition must specify exactly one field, but found 2");
        });
    });
});
