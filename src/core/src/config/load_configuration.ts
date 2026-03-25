import fs from 'fs';
import path from 'node:path'
import { checkSchema } from "./check_schema";
import { IUserConfig } from "./types";
import logger from '../common/logger'

const DEFAULT_FILENAMES = [
  'cumber-storm.json',
]

export interface ILoadConfigurationOptions {
    file?: string;
    cwd?: string;
}

export function loadUserConfiguration(options: ILoadConfigurationOptions = {}): IUserConfig {
    const cwd = options.cwd || process.cwd();
    const configFile = options.file || inferConfigFile(cwd);
    if (!configFile) {
        logger.error('No configuration file found');
        throw new Error('Configuration file not found. Please provide a configuration file.');
    }
    logger.info(`Loading configuration from: ${configFile}`);
    const resolvedUserConfig =  parseUserConfigFromFile(configFile);
    logger.info(`Configuration loaded: ${resolvedUserConfig.rules.length} rules found`);
    return resolvedUserConfig;
}

export function inferConfigFile(cwd: string): string | undefined {
    if(!path.isAbsolute(cwd)){
        throw new Error(`${cwd} should be an absolute path`)
    }
    logger.debug(`Inferring config file in directory with absolute path ${cwd}`)
    const configFiles = DEFAULT_FILENAMES.filter(filename => 
        fs.existsSync(path.join(cwd, filename))
    );

    if (configFiles.length <= 0) {
        return undefined;
    }
    
    if (configFiles.length > 1) {
        logger.error(`Failed to infer configuration file.`);
        throw new Error(`Multiple configuration files found in ${cwd}: ${configFiles.join(', ')}. Please specify which one to use.`);
    }
    
    return configFiles[0] ? path.join(cwd, configFiles[0]) : undefined;
}

export function parseUserConfigFromFile(file: string): IUserConfig {
    const content = fs.readFileSync(file, 'utf-8');
    return parseUserConfigFromJson(content);
}

export function parseUserConfigFromJson(content: string): IUserConfig {
    const configObj = JSON.parse(content);
    const errors = checkSchema(configObj);
    
    if (errors.length > 0) {
        logger.error('Configuration schema validation failed');
        errors.forEach(error => logger.error(`  - ${error.message}`));
        throw new Error(
            `Configuration schema validation failed\n` +
            errors.map(e => `  - ${e.message}`).join('\n')
        );
    }
    return configObj as IUserConfig;
}