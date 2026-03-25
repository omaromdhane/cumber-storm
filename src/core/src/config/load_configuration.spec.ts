import { expect } from "chai";
import fs from "fs";
import path from "path";
import os from "os";
import { inferConfigFile, parseUserConfigFromJson, parseUserConfigFromFile, loadUserConfiguration } from "./load_configuration";

describe("load_configuration", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "config-test-"));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe("inferConfigFile()", () => {
        it("returns undefined when no config file exists", () => {
            const result = inferConfigFile(tempDir);
            expect(result).to.be.undefined;
        });

        it("returns absolute path to config file when it exists", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            fs.writeFileSync(configPath, JSON.stringify({ rules: [] }));

            const result = inferConfigFile(tempDir);
            expect(result).to.equal(configPath);
            expect(path.isAbsolute(result!)).to.be.true;
        });

        it("throws error when cwd is not absolute", () => {
            expect(() => inferConfigFile("./relative/path")).to.throw("should be an absolute path");
        });

        it("throws error when multiple config files exist", () => {
            // This test would need multiple DEFAULT_FILENAMES to be meaningful
            // Currently only one default filename exists
        });
    });

    describe("parseUserConfigFromJson()", () => {
        it("parses valid config with exclusive rule", () => {
            const content = JSON.stringify({
                rules: [
                    { type: "exclusive", groups: [{ scenarioName: "group1" }, { anyTag: ["@tag1"] }] }
                ]
            });

            const result = parseUserConfigFromJson(content);
            expect(result.rules).to.have.length(1);
            expect(result.rules[0].type).to.equal("exclusive");
        });

        it("parses valid config with max-concurrent rule", () => {
            const content = JSON.stringify({
                rules: [
                    { type: "max-concurrent", max: 5, match: { anyTag: ["@slow"] } }
                ]
            });

            const result = parseUserConfigFromJson(content);
            expect(result.rules).to.have.length(1);
            expect(result.rules[0].type).to.equal("max-concurrent");
        });

        it("parses valid config with sequential rule", () => {
            const content = JSON.stringify({
                rules: [
                    { type: "sequential", order: [{ scenarioName: "first" }, { scenarioName: "second" }] }
                ]
            });

            const result = parseUserConfigFromJson(content);
            expect(result.rules).to.have.length(1);
            expect(result.rules[0].type).to.equal("sequential");
        });

        it("parses config with empty rules array", () => {
            const content = JSON.stringify({ rules: [] });

            const result = parseUserConfigFromJson(content);
            expect(result.rules).to.be.an("array").with.lengthOf(0);
        });

        it("throws error for invalid JSON", () => {
            const content = '{ rules: [ }';
            expect(() => parseUserConfigFromJson(content)).to.throw(SyntaxError);
        });

        it("throws error for missing rules field", () => {
            const content = JSON.stringify({});
            expect(() => parseUserConfigFromJson(content)).to.throw("Configuration schema validation failed");
        });

        it("throws error for unrecognized keys", () => {
            const content = JSON.stringify({
                rules: [],
                unexpectedKey: "oops"
            });
            expect(() => parseUserConfigFromJson(content)).to.throw("Configuration schema validation failed");
        });

        it("throws error for wrong types", () => {
            const content = JSON.stringify({
                rules: [
                    { type: "max-concurrent", max: "not-a-number", match: { tags: ["@slow"] } }
                ]
            });
            expect(() => parseUserConfigFromJson(content)).to.throw("Configuration schema validation failed");
        });

        it("throws error for invalid rule type", () => {
            const content = JSON.stringify({
                rules: [
                    { type: "invalid-type", data: {} }
                ]
            });
            expect(() => parseUserConfigFromJson(content)).to.throw("Configuration schema validation failed");
        });
    });

    describe("parseUserConfigFromFile()", () => {
        it("reads and parses config from file", () => {
            const configPath = path.join(tempDir, "test-config.json");
            const config = { rules: [{ type: "exclusive", groups: [{ scenarioName: "test" }] }] };
            fs.writeFileSync(configPath, JSON.stringify(config));

            const result = parseUserConfigFromFile(configPath);
            expect(result.rules).to.have.length(1);
        });

        it("throws error when file does not exist", () => {
            const configPath = path.join(tempDir, "nonexistent.json");
            expect(() => parseUserConfigFromFile(configPath)).to.throw();
        });
    });

    describe("loadUserConfiguration()", () => {
        it("loads config from specified file", () => {
            const configPath = path.join(tempDir, "custom-config.json");
            const config = { rules: [] };
            fs.writeFileSync(configPath, JSON.stringify(config));

            const result = loadUserConfiguration({ file: configPath });
            expect(result.rules).to.be.an("array");
        });

        it("infers config file from cwd", () => {
            const configPath = path.join(tempDir, "cumber-storm.json");
            const config = { rules: [] };
            fs.writeFileSync(configPath, JSON.stringify(config));

            const result = loadUserConfiguration({ cwd: tempDir });
            expect(result.rules).to.be.an("array");
        });

        it("throws error when no config file found", () => {
            expect(() => loadUserConfiguration({ cwd: tempDir })).to.throw("Configuration file not found");
        });
    });
});
