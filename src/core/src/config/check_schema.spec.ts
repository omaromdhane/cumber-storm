import { expect } from "chai";
import { checkSchema } from "./check_schema";

describe("checkSchema", () => {
    describe("Valid Configurations", () => {
        it("accepts valid max-concurrent rule with regex strategy", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login.*",
                            options: {
                                strategy: "regex"
                            }
                        }
                    }
                ]
            };
            const result = checkSchema(config);
            expect(result).to.be.empty;
        });

        it("accepts valid matcher with ignoreCase option", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "login",
                            options: {
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.be.empty;
        });

        it("accepts valid matcher with both strategy and ignoreCase", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "login",
                            options: {
                                strategy: "regex",
                                ignoreCase: true
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.be.empty;
        });

        it("accepts exact strategy", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login test",
                            options: {
                                strategy: "exact"
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.be.empty;
        });

        it("accepts matcher without options", () => {
            const config = {
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

            const result = checkSchema(config);
            expect(result).to.be.empty;
        });

        it("accepts all matcher types with options", () => {
            const config = {
                rules: [
                    {
                        type: "exclusive",
                        groups: [
                            {
                                scenarioName: "Login",
                                options: { strategy: "exact" }
                            },
                            {
                                allTags: ["@smoke"],
                                options: { ignoreCase: true }
                            },
                            {
                                anyTag: ["@critical"],
                                options: { strategy: "regex" }
                            },
                            {
                                uri: "features/auth",
                                options: { ignoreCase: true }
                            },
                            {
                                featureFileName: "login.feature",
                                options: { strategy: "exact" }
                            }
                        ]
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.be.empty;
        });
    });

    describe("Invalid Configurations", () => {
        it("rejects invalid strategy", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login",
                            options: {
                                strategy: "invalid"
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.not.be.empty;
        });

        it("rejects non-boolean ignoreCase", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login",
                            options: {
                                ignoreCase: "true"
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.not.be.empty;
        });

        it("rejects unrecognized option keys", () => {
            const config = {
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login",
                            options: {
                                unknownOption: true
                            }
                        }
                    }
                ]
            };

            const result = checkSchema(config);
            expect(result).to.not.be.empty;
        });

        it("rejects matcher with unrecognized keys", () => {
            const config = JSON.stringify({
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: {
                            scenarioName: "Login",
                            invalidKey: "value"
                        }
                    }
                ]
            });

            const result = checkSchema(config);
            expect(result).to.not.be.empty;
        });
    });
});
