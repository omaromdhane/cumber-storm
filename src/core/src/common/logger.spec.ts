import { expect } from "chai";
import fs from "fs";
import path from "path";
import os from "os";
import logger, { setUpFileLogger, getLogFilePath, resetLogger, LogLevel, setupConsoleLogger } from "./logger";

describe("logger", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-test-"));
        resetLogger();
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe("setUpFileLogger()", () => {
        it("creates log directory if it doesn't exist", () => {
            const logDir = path.join(tempDir, "logs", "nested");

            expect(fs.existsSync(logDir)).to.be.false;

            setUpFileLogger("test.log", logDir, LogLevel.INFO);

            expect(fs.existsSync(logDir)).to.be.true;
        });

        it("creates log file when configured", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            logger.info("Test message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            expect(fs.existsSync(logFile)).to.be.true;
        });

        it("writes log messages to file", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            logger.info("Test info message");
            logger.error("Test error message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.include("Test info message");
            expect(content).to.include("Test error message");
        });

        it("respects log level configuration", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.ERROR);

            logger.debug("Debug message");
            logger.info("Info message");
            logger.error("Error message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.not.include("Debug message");
            expect(content).to.not.include("Info message");
            expect(content).to.include("Error message");
        });

        it("formats log messages with timestamp and level", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            logger.info("Formatted message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(content).to.include("info");
            expect(content).to.include("Formatted message");
        });

        it("handles multiple log files by reconfiguring", async () => {
            setUpFileLogger("test1.log", tempDir, LogLevel.INFO);

            logger.info("Message to file 1");

            await new Promise(resolve => setTimeout(resolve, 100));

            setUpFileLogger("test2.log", tempDir, LogLevel.INFO);
            logger.info("Message to file 2");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile1 = path.join(tempDir, "test1.log");
            const logFile2 = path.join(tempDir, "test2.log");
            const content1 = fs.readFileSync(logFile1, "utf-8");
            const content2 = fs.readFileSync(logFile2, "utf-8");

            expect(content1).to.include("Message to file 1");
            expect(content2).to.include("Message to file 2");
        });

        it("creates nested directories recursively", async () => {
            const logDir = path.join(tempDir, "a", "b", "c");

            setUpFileLogger("test.log", logDir, LogLevel.INFO);

            logger.info("Test message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(logDir, "test.log");
            expect(fs.existsSync(logFile)).to.be.true;
        });
    });

    describe("logger instance", () => {
        it("has winston logger methods", () => {
            expect(logger).to.exist;
            expect(logger).to.have.property("info");
            expect(logger).to.have.property("error");
            expect(logger).to.have.property("warn");
            expect(logger).to.have.property("debug");
        });
    });

    describe("getLogFilePath()", () => {
        it("returns undefined when no log file is configured initially", () => {
            const logPath = getLogFilePath();
            expect(logPath).to.be.undefined;
        });

        it("returns the configured log file path", () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            const logPath = getLogFilePath();
            expect(logPath).to.equal(path.join(tempDir, "test.log"));
        });

        it("updates when logger is reconfigured", () => {
            const logDir1 = path.join(tempDir, "logs1");
            const logDir2 = path.join(tempDir, "logs2");

            setUpFileLogger("test1.log", logDir1, LogLevel.INFO);
            expect(getLogFilePath()).to.equal(path.join(logDir1, "test1.log"));

            setUpFileLogger("test2.log", logDir2, LogLevel.INFO);
            expect(getLogFilePath()).to.equal(path.join(logDir2, "test2.log"));
        });
    });

    describe("overrideConsoleLogLevel()", () => {
        it("changes console log level without errors", () => {
            setupConsoleLogger(LogLevel.ERROR);
            setupConsoleLogger(LogLevel.DEBUG);
            setupConsoleLogger(LogLevel.INFO);
        });
    });

    describe("LogLevel enum", () => {
        it("has all standard log levels", () => {
            expect(LogLevel.ERROR).to.equal("error");
            expect(LogLevel.WARN).to.equal("warn");
            expect(LogLevel.INFO).to.equal("info");
            expect(LogLevel.HTTP).to.equal("http");
            expect(LogLevel.VERBOSE).to.equal("verbose");
            expect(LogLevel.DEBUG).to.equal("debug");
            expect(LogLevel.SILLY).to.equal("silly");
        });
    });

    describe("log level filtering", () => {
        it("logs all levels when set to DEBUG", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.DEBUG);

            logger.debug("Debug message");
            logger.info("Info message");
            logger.warn("Warn message");
            logger.error("Error message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.include("Debug message");
            expect(content).to.include("Info message");
            expect(content).to.include("Warn message");
            expect(content).to.include("Error message");
        });

        it("filters out lower priority messages when set to WARN", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.WARN);

            logger.debug("Debug message");
            logger.info("Info message");
            logger.warn("Warn message");
            logger.error("Error message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.not.include("Debug message");
            expect(content).to.not.include("Info message");
            expect(content).to.include("Warn message");
            expect(content).to.include("Error message");
        });
    });

    describe("file writing", () => {
        it("appends to existing log file", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            logger.info("First message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            logger.info("Second message");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.include("First message");
            expect(content).to.include("Second message");
        });

        it("handles special characters in log messages", async () => {
            setUpFileLogger("test.log", tempDir, LogLevel.INFO);

            logger.info("Message with special chars: @#$%^&*()");
            logger.info("Message with unicode: 你好世界");

            await new Promise(resolve => setTimeout(resolve, 100));
            
            const logFile = path.join(tempDir, "test.log");
            const content = fs.readFileSync(logFile, "utf-8");
            expect(content).to.include("@#$%^&*()");
            expect(content).to.include("你好世界");
        });
    });
});
