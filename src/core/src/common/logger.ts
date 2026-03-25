import winston from "winston";
import path from "node:path";
import fs from "node:fs";

export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	HTTP = 'http',
	VERBOSE = 'verbose',
	DEBUG = 'debug',
	SILLY = 'silly'
}

const consoleTransportConfig = {
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.printf(({ timestamp, level, message, ...meta }) => {
			const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
			return `${level}: ${message} ${metaStr}`;
		})
	),
	level: LogLevel.INFO,
	silent: true
};

const fileTransportConfig = {
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(({ timestamp, level, message, ...meta }) => {
				const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
				return `${timestamp} [${level}]: ${message} ${metaStr}`;
			}
		)
	),
	level: LogLevel.SILLY,
	filename: '',
	dirname: '',
	silent: true
}

let currentLogFilePath: string | undefined;

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console(consoleTransportConfig),
	],
});

function rebuildLogger(): void {
	logger.clear();
	if(!consoleTransportConfig.silent){
		logger.add(new winston.transports.Console(consoleTransportConfig));
	}
	if(!fileTransportConfig.silent){
		logger.add(new winston.transports.File(fileTransportConfig));
	}
}

export function setupConsoleLogger(level: LogLevel): void {
	consoleTransportConfig.level = level;
	consoleTransportConfig.silent = false;
	rebuildLogger();
}

export function setUpFileLogger(fileName: string, dirName: string, logLevel: LogLevel = LogLevel.SILLY): void {
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName, { recursive: true });
	}
	fileTransportConfig.level = logLevel;
	fileTransportConfig.filename = fileName;
	fileTransportConfig.dirname = dirName;
	fileTransportConfig.silent = false;
	rebuildLogger();
	currentLogFilePath = path.join(dirName, fileName);
}

export const getLogFilePath = (): string | undefined => {
	return currentLogFilePath;
};

export const resetLogger = (): void => {
	currentLogFilePath = undefined;
	fileTransportConfig.silent = true;
	fileTransportConfig.filename = '';
	fileTransportConfig.dirname = '';
	rebuildLogger();
};

export default logger;