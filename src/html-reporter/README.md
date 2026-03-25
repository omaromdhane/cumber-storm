# CumberStorm HTML Reporter

A beautiful, interactive HTML reporter for CumberStorm test results.

## Features

- 📊 Visual summary with pass/fail statistics
- 🎨 Clean, modern UI with responsive design
- 🔍 Filter scenarios by status (passed, failed, skipped)
- 📁 Organized by feature files
- ⏱️ Detailed timing information
- 🏷️ Tag display for scenarios
- 📱 Mobile-friendly interface

## Installation

```bash
npm install @cumberstorm/html-reporter
```

## Usage

### CLI Usage

```bash
# Basic usage
npx cumberstorm-html-report report.json

# Specify output file
npx cumberstorm-html-report report.json output.html

# With project name and environment
npx cumberstorm-html-report report.json output.html --name "My Project" --env "Production"

# Show help
npx cumberstorm-html-report --help
```

### Programmatic Usage

```typescript
import { generateHTMLReport } from '@cumberstorm/html-reporter';

// Basic usage
await generateHTMLReport({
  inputFile: 'path/to/report.json',
  outputFile: 'test-report.html'
});

// With all options
await generateHTMLReport({
  inputFile: 'path/to/report.json',
  outputFile: 'test-report.html',
  outputDir: './reports',  // Optional: specify output directory
  projectName: 'My Test Suite',
  environment: 'Staging'
});
```

### Integration with CumberStorm Core (Event-Based - Recommended)

The HTML reporter can generate reports directly from CumberStorm's event system:

```typescript
import { CumberStorm, CumberStormReporter } from '@cumberstorm/core';
import { generateHTMLReportFromEvents } from '@cumberstorm/html-reporter';

// Create reporter to collect events
const reporter = new CumberStormReporter({ captureRawEvents: true });

const storm = new CumberStorm({
  cwd: process.cwd(),
  file: 'cumber-storm.json'
});

// Run tests
await storm.run();

// Generate report from collected events
const report = reporter.generateReport();

// Generate HTML report
await generateHTMLReportFromEvents(report, {
  outputDir: '.cumberstorm/reports',
  outputFile: 'test-report.html',
  projectName: 'My Project',
  environment: process.env.NODE_ENV
});
```

### Save Both JSON and HTML Reports

```typescript
import { CumberStormReporter } from '@cumberstorm/core';
import { saveReportWithHTML } from '@cumberstorm/html-reporter';

const reporter = new CumberStormReporter();
// ... run tests ...
const report = reporter.generateReport();

// Save both JSON and HTML in one call
const { jsonPath, htmlPath } = await saveReportWithHTML(report, {
  outputDir: './reports',
  jsonFile: 'report.json',
  outputFile: 'report.html',
  projectName: 'My Test Suite'
});

console.log(`JSON: ${jsonPath}`);
console.log(`HTML: ${htmlPath}`);
```

### Using in Other Packages

```typescript
// In your test runner or CI script
import { generateHTMLReport } from '@cumberstorm/html-reporter';

async function runTestsAndGenerateReport() {
  // ... run your tests and generate JSON report ...
  
  const reportPath = await generateHTMLReport({
    inputFile: './test-results/report.json',
    outputDir: './test-results',
    outputFile: 'index.html',
    projectName: 'My API Tests',
    environment: 'CI'
  });
  
  console.log(`Report available at: ${reportPath}`);
}
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Report Data Format

The reporter expects data in the `ITestRunReport` format from `@cumberstorm/core`:

```typescript
interface ITestRunReport {
  startTime: number;
  endTime?: number;
  duration?: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  results: ITestResult[];
  summary: ITestRunSummary;
}
```

## License

MIT
