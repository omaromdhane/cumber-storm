import logger, {
    setupConsoleLogger, 
    setUpFileLogger,
    LogLevel 
} from '../common/logger'
import path from 'path';
import { setParallelCanAssign } from '@cucumber/cucumber';
import fs from 'fs';
import { ParallelExecutionScheduler } from '../execution/parallel_execution_scheduler';
import { CumberStormReporter } from '../reporting';
import { generateHTMLReport } from '../reporting/generator';
import { loadUserConfiguration } from '../config';
import { flattenUserConfig } from '../config/flattened_config';
import { CumberEvent, Events, globalPubsub } from '../events';
import { IFlattenedConfig, IUserConfig } from '../config/types';

export type CumberStormConfig = {
    setParallelCanAssign: typeof setParallelCanAssign;
    configPath?: string;
    cwd?: string;
    logDir?: string;
    logLevel?: LogLevel;
    reportDir?: string;
    autoGenerateReport?: boolean;
}

export class CumberStorm {
    private _userConfig: IUserConfig | undefined;
    private _flattenedConfig: IFlattenedConfig | undefined;
    private _parallelScheduler: ParallelExecutionScheduler | undefined;
    private _reporter: CumberStormReporter;
    private _cwd: string;
    private _logFilePath: string;
    private _logFileName: string;
    private _reportDir: string;
    private _autoGenerateReport: boolean;
    private _reportGenerationAttempted = false;
    
    public constructor(config: CumberStormConfig) {
        if (process.env.CUCUMBER_WORKER_ID) {
            throw new Error('Cumberstorm object should be created in the master node.')
        }
        this._cwd = config.cwd || process.cwd();
        this._autoGenerateReport = config.autoGenerateReport ?? true;
        this._reportDir = config.reportDir || path.join(this._cwd, '.cumberstorm', 'reports');
        
        // Setup logging with file output
        const logDir = config.logDir || path.join(this._cwd, '.cumberstorm', 'logs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this._logFileName = `cumberstorm-${timestamp}.log`;
        this._logFilePath = path.join(logDir, this._logFileName);
        
        if(config.logLevel!==undefined) setupConsoleLogger(config.logLevel);
        setUpFileLogger(this._logFileName, logDir);

        logger.info('CumberStorm initializing...');
        logger.info(`Working directory: ${this._cwd}`);
        logger.debug(`Log file: ${this._logFilePath}`);
        
        // Initialize reporter
        this._reporter = new CumberStormReporter();
        
        try {
            // Load cumberstorm user config
            this._userConfig = loadUserConfiguration({
                file: config.configPath,
                cwd: this._cwd,
            });
            
            this._flattenedConfig = flattenUserConfig(this._userConfig);
            
            // Apply the rules to Cucumber's parallel execution
            this._parallelScheduler = new ParallelExecutionScheduler(
                config.setParallelCanAssign, 
                this._flattenedConfig.rules
            );
            this._parallelScheduler.applyRules();

            // Setup error handling and report generation
            if (this._autoGenerateReport) {
                this.setupReportGeneration();
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error initializing Cumberstorm: ${errorMessage}`);
            logger.error(`Full logs available at: ${this._logFilePath}`);
            
            // Emit error event
            this.emitError('initialization', error);
            
            // Try to generate report on error
            this.generateAndSaveReport();
            
            throw error;
        }
    }

    private setupReportGeneration(): void {
        // Generate report when process exits (normal or error)
        process.on('exit', (code) => {
            logger.info(`Process exiting with code ${code}, generating report...`);
            this.generateAndSaveReport();
        });

        // Capture uncaught errors (and exit gracefully)
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            this.emitError('uncaught_exception', error);
            this.generateAndSaveReport();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection:', reason);
            this.emitError('unhandled_rejection', reason);
            this.generateAndSaveReport();
            process.exit(1);
        });
    }

    private emitError(context: string, error: unknown): void {
        try {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            
            // Emit error event (WORKER_ERROR expects CumberEvent with no data)
            globalPubsub.emit(Events.WORKER_ERROR, new CumberEvent());
            
            logger.error(`Error in ${context}: ${errorMessage}`);
            if (errorStack) {
                logger.debug(`Stack trace: ${errorStack}`);
            }
        } catch (emitError) {
            // Silently fail if we can't emit the error event
            logger.error('Failed to emit error event:', emitError);
        }
    }

    private async generateAndSaveReport(): Promise<void> {
        // Prevent infinite loop - only attempt once
        if (this._reportGenerationAttempted) {
            logger.warn('Report generation already attempted, skipping to prevent infinite loop');
            return;
        }
        
        this._reportGenerationAttempted = true;
        
        try {
            logger.info('Generating CumberStorm report...');
            const report = this._reporter.generateReport();
            
            // Ensure report directory exists
            if (!fs.existsSync(this._reportDir)) {
                fs.mkdirSync(this._reportDir, { recursive: true });
            }
            
            // Generate HTML report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const htmlFile = `cumberstorm-report-${timestamp}.html`;
            try {
                const htmlPath = await generateHTMLReport(report, {
                    outputDir: this._reportDir,
                    outputFile: htmlFile,
                });
                logger.info(`HTML report generated: ${htmlPath}`);
            } catch (htmlError) {
                const msg = htmlError instanceof Error ? htmlError.message : String(htmlError);
                logger.warn(`Could not generate HTML report: ${msg}`);
            }

            logger.info(`Total scheduling decisions: ${report.totalDecisions}`);
            logger.info(`Max concurrency: ${report.maxConcurrency}`);
            logger.info(`Allowed: ${report.allowedDecisions}, Blocked: ${report.blockedDecisions}`);
            
        } catch (error) {
            // Catch any errors during report generation to prevent infinite loop
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to generate or save report: ${errorMessage}`);
            logger.error('Report generation failed, but continuing execution');
        }
    }

    /** @internal - not part of the public API, for testing only */
    public getConfig(): IUserConfig | undefined {
        return this._userConfig;
    }

    public getLogFilePath(): string {
        return this._logFilePath;
    }

    public getReportDir(): string {
        return this._reportDir;
    }
}