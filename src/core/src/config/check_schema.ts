import { z } from "zod";

const matchingStrategySchema = z.enum(['exact', 'regex']);

const matcherOptionsSchema = z.object({
    ignoreCase: z.boolean().optional(),
    strategy: matchingStrategySchema.optional(),
}).strict();

const matcherSchema = z.object({
    scenarioName: z.string().optional(),
    allTags: z.array(z.string()).optional(),
    anyTag: z.array(z.string()).optional(),
    uri: z.string().optional(),
    featureFileName: z.string().optional(),
    options: matcherOptionsSchema.optional(),
}).strict();

const exclusiveRuleSchema = z.object({
    type: z.literal("exclusive"),
    groups: z.array(matcherSchema),
}).strict();

const maxConcurrentRuleSchema = z.object({
    type: z.literal("max-concurrent"),
    max: z.number().int().positive(),
    match: matcherSchema,
}).strict();

const sequentialRuleSchema = z.object({
    type: z.literal("sequential"),
    order: z.array(matcherSchema),
}).strict();

export const ruleSchema = z.union([
    exclusiveRuleSchema,
    maxConcurrentRuleSchema,
    sequentialRuleSchema,
]);

export const configSchema = z.object({
    rules: z.array(ruleSchema),
}).strict();


export interface ConfigParseError {
    message: string;
    path?: string;
}

export function checkSchema(config: any): ConfigParseError[] {
    const result = configSchema.safeParse(config);
    if (!result.success) {
        const errors = result.error.issues.map(formatZodError);
        return errors;
    }
    return [];
}

function formatZodError(issue: z.ZodIssue): ConfigParseError {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    
    // Format different error types
    if (issue.code === 'invalid_type') {
        const typeIssue = issue as any;
        return {
            message: `Expected ${typeIssue.expected} at '${path}', but received ${typeIssue.received}`,
            path,
        };
    }
    
    if (issue.code === 'invalid_value') {
        return {
            message: `Invalid value at '${path}': ${issue.message}`,
            path,
        };
    }
    
    if (issue.code === 'unrecognized_keys') {
        const keys = (issue as any).keys?.join(', ') || 'unknown';
        return {
            message: `Unrecognized keys at '${path}': ${keys}`,
            path,
        };
    }
    
    if (issue.code === 'invalid_union') {
        return {
            message: `Invalid rule configuration at '${path}'. Must be one of: exclusive, max-concurrent, or sequential`,
            path,
        };
    }
    
    return {
        message: `${issue.message} at '${path}'`,
        path,
    };
}