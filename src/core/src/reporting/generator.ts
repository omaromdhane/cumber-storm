import fs from 'fs';
import path from 'path';
import type { ICumberStormReport } from '@cumberstorm/reporting';

export interface HTMLReportOptions {
    outputDir?: string;
    outputFile?: string;
    projectName?: string;
}

/**
 * Generate an HTML report from a CumberStorm report object.
 * Requires the html-reporter to be built first (its output lands in core/dist/html-reporter-template).
 */
export async function generateHTMLReport(
    report: ICumberStormReport,
    options: HTMLReportOptions = {}
): Promise<string> {
    const {
        outputDir = './reports',
        outputFile = 'cumberstorm-report.html',
        projectName = 'CumberStorm Report',
    } = options;

    // The html-reporter vite build outputs to core/dist/html-reporter-template
    const templateCandidates = [
        path.join(process.cwd(), 'node_modules/@cumberstorm/core/dist/html-reporter-template/index.html'),
        path.resolve(__dirname, '../html-reporter-template/index.html'),
        path.resolve(__dirname, './html-reporter-template/index.html'),
    ];

    const templatePath = templateCandidates.find(p => fs.existsSync(p));

    if (!templatePath) {
        throw new Error(
            `HTML reporter template not found. Build the html-reporter first:\n` +
            `  cd src/html-reporter && npm run build\n` +
            `Looked in:\n${templateCandidates.map(p => `  ${p}`).join('\n')}`
        );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Inject report data and project name before </head>
    const injection = `<script>
window.__REPORT_DATA__ = ${JSON.stringify(report)};
window.__PROJECT_NAME__ = ${JSON.stringify(projectName)};
</script>`;

    html = html.replace('</head>', `${injection}\n</head>`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFile);
    fs.writeFileSync(outputPath, html, 'utf-8');

    return outputPath;
}
