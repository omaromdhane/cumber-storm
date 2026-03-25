import { expect } from "chai";
import fs from "fs";
import path from "path";
import os from "os";
import { Pickle } from "@cucumber/messages";

import { CumberStorm, CumberStormConfig } from "./cumber_storm";

describe("CumberStorm", () => {
    let tempDir: string;
    let mockSetParallelCanAssign: any;
    let capturedCallback: ((pickle: Pickle, running: Pickle[]) => boolean) | null;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cumberstorm-test-"));
        capturedCallback = null;
        mockSetParallelCanAssign = (callback: (pickle: Pickle, running: Pickle[]) => boolean) => {
            capturedCallback = callback;
        };
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    const createValidConfig = () => ({
        rules: [
            {
                type: "max-concurrent" as const,
                max: 2,
                match: { anyTag: ["@slow"] }
            }
        ]
    });

    const createPickle = (id: string, name: string, tags: string[] = []): Pickle => ({
        id,
        name,
        uri: "test.feature",
        astNodeIds: [id],
        language: "en",
        steps: [],
        tags: tags.map(tag => ({
            name: tag,
            id: `tag-${tag}`,
            astNodeId: `ast-${tag}`
        }))
    } as Pickle);

    describe("constructor", () => {
        it("initializes with valid configuration file", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            const cumberStorm = new CumberStorm(config);

            expect(cumberStorm.getConfig()).to.exist;
            expect(cumberStorm.getConfig()?.rules).to.have.length(1);
        });

        it("initializes with inferred configuration file", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                cwd: tempDir
            };

            const cumberStorm = new CumberStorm(config);

            expect(cumberStorm.getConfig()).to.exist;
        });

        it("uses process.cwd() when cwd is not provided", () => {
            const configPath = path.join(process.cwd(), "cumber-storm.json");
            const configExists = fs.existsSync(configPath);
            
            if (!configExists) {
                fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));
            }

            try {
                const config: CumberStormConfig = {
                    setParallelCanAssign: mockSetParallelCanAssign,
                    configPath
                };

                const cumberStorm = new CumberStorm(config);
                expect(cumberStorm.getConfig()).to.exist;
            } finally {
                if (!configExists && fs.existsSync(configPath)) {
                    fs.unlinkSync(configPath);
                }
            }
        });

        it("throws error when configuration file is not found", () => {
            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                cwd: tempDir
            };

            expect(() => new CumberStorm(config)).to.throw("Configuration file not found");
        });

        it("throws error when configuration is invalid", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({ invalid: "config" }));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            expect(() => new CumberStorm(config)).to.throw();
        });

        it("applies rules to setParallelCanAssign", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            new CumberStorm(config);

            expect(capturedCallback).to.not.be.null;
        });

        it("creates log file in default location", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            const cumberStorm = new CumberStorm(config);
            const logPath = cumberStorm.getLogFilePath();

            expect(logPath).to.include(".cumberstorm");
            expect(logPath).to.include("logs");
        });

        it("creates log file in custom location", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            const customLogDir = path.join(tempDir, "custom-logs");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir,
                logDir: customLogDir
            };

            const cumberStorm = new CumberStorm(config);
            const logPath = cumberStorm.getLogFilePath();

            expect(logPath).to.include("custom-logs");
        });
    });

    describe("getConfig()", () => {
        it("returns loaded user configuration", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            const configData = createValidConfig();
            fs.writeFileSync(configPath, JSON.stringify(configData));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            const cumberStorm = new CumberStorm(config);
            const userConfig = cumberStorm.getConfig();

            expect(userConfig).to.exist;
            expect(userConfig?.rules).to.deep.equal(configData.rules);
        });
    });

    describe("getLogFilePath()", () => {
        it("returns the log file path", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify(createValidConfig()));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            const cumberStorm = new CumberStorm(config);
            const logPath = cumberStorm.getLogFilePath();

            expect(logPath).to.be.a("string");
            expect(logPath).to.have.length.greaterThan(0);
        });
    });

    describe("rule application", () => {
        it("applies max-concurrent rule correctly", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({
                rules: [
                    {
                        type: "max-concurrent",
                        max: 1,
                        match: { allTags: ["@slow"] }
                    }
                ]
            }));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            new CumberStorm(config);

            expect(capturedCallback).to.not.be.null;

            const slowPickle1 = createPickle("1", "Slow Test 1", ["@slow"]);
            const slowPickle2 = createPickle("2", "Slow Test 2", ["@slow"]);

            // First slow test should be allowed
            expect(capturedCallback!(slowPickle1, [])).to.be.true;

            // Second slow test should be blocked
            expect(capturedCallback!(slowPickle2, [slowPickle1])).to.be.false;
        });

        it("applies exclusive rule correctly", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({
                rules: [
                    {
                        type: "exclusive",
                        groups: [
                            { allTags: ["@database"] },
                            { allTags: ["@api"] }
                        ]
                    }
                ]
            }));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            new CumberStorm(config);

            const dbPickle = createPickle("1", "DB Test", ["@database"]);
            const apiPickle = createPickle("2", "API Test", ["@api"]);

            // DB test should be allowed when nothing is running
            expect(capturedCallback!(dbPickle, [])).to.be.true;

            // API test should be blocked when DB test is running
            expect(capturedCallback!(apiPickle, [dbPickle])).to.be.false;
        });

        it("applies sequential rule correctly", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({
                rules: [
                    {
                        type: "sequential",
                        order: [
                            { scenarioName: "First.*" },
                            { scenarioName: "Second.*" }
                        ]
                    }
                ]
            }));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            new CumberStorm(config);

            const firstPickle = createPickle("1", "First Test");
            const secondPickle = createPickle("2", "Second Test");

            // First test should be allowed
            expect(capturedCallback!(firstPickle, [])).to.be.true;

            // Second test should be blocked until first completes
            expect(capturedCallback!(secondPickle, [firstPickle])).to.be.false;
        });

        it("applies multiple rules simultaneously", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({
                rules: [
                    {
                        type: "max-concurrent",
                        max: 2,
                        match: { allTags: ["@slow"] }
                    },
                    {
                        type: "exclusive",
                        groups: [
                            { allTags: ["@database"] }
                        ]
                    }
                ]
            }));

            const config: CumberStormConfig = {
                setParallelCanAssign: mockSetParallelCanAssign,
                configPath,
                cwd: tempDir
            };

            new CumberStorm(config);

            const slowPickle1 = createPickle("1", "Slow 1", ["@slow"]);
            const slowPickle2 = createPickle("2", "Slow 2", ["@slow"]);
            const slowPickle3 = createPickle("3", "Slow 3", ["@slow"]);
            const dbPickle1 = createPickle("4", "DB 1", ["@database"]);

            // Two slow tests should be allowed
            expect(capturedCallback!(slowPickle1, [])).to.be.true;
            expect(capturedCallback!(slowPickle2, [slowPickle1])).to.be.true;

            // Third slow test should be blocked (max-concurrent rule)
            expect(capturedCallback!(slowPickle3, [slowPickle1, slowPickle2])).to.be.false;

            // DB test should be allowed (exclusive rule with single group doesn't block same group)
            expect(capturedCallback!(dbPickle1, [])).to.be.true;
        });
    });
});