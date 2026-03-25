import { globalEventCollector } from '../events/global_event_collector';
import { Events, ISetParallelDemandEventData } from '../events/types';
import type { IConcurrencySnapshot, ICumberStormReport, IRuleStats, ISchedulingDecision } from '@cumberstorm/reporting';

export interface ICumberStormReporterOptions {
    projectName?: string;
}

/**
 * Reporter that uses the global event collector to generate execution reports
 */
export class CumberStormReporter {

    constructor(_options: ICumberStormReporterOptions = {}) {
    }

    /**
     * Generate the final report from collected events
     */
    generateReport(): ICumberStormReport {
        const demandEvents = globalEventCollector.getByEvent(Events.SET_PARALLEL_DEMAND);
        
        const schedulingDecisions: ISchedulingDecision[] = [];
        const ruleStatsMap = new Map<string, IRuleStats>();
        const concurrencySnapshots: IConcurrencySnapshot[] = [];
        
        let startTime: Date | undefined;
        let endTime: Date | undefined;

        for (const collectedEvent of demandEvents) {
            const eventData = collectedEvent.data.data as ISetParallelDemandEventData;
            const timestamp = collectedEvent.data.timestamp;
            
            if (!startTime || timestamp < startTime) startTime = timestamp;
            if (!endTime || timestamp > endTime) endTime = timestamp;
            
            // Map internal event data to reportable scheduling decision
            const decision: ISchedulingDecision = {
                candidate: eventData.candidate,
                runningPickles: eventData.runningPickles,
                runnedPickles: eventData.runnedPickles,
                rules_results: eventData.rules_results.map(rr => ({
                    rule: {
                        id: rr.rule.id,
                        name: rr.rule.name,
                        matchers: rr.rule.getMatchers().map(m => ({
                            id: m.id,
                            level: m.level,
                            type: m.type,
                            pattern: m.getPattern(),
                        })),
                    },
                    result: {
                        allowed: rr.result.allowed,
                        reason: rr.result.reason,
                        metadata: rr.result.metadata,
                        evaluatedAt: rr.result.evaluatedAt,
                    },
                })),
            };

            schedulingDecisions.push(decision);
            
            concurrencySnapshots.push({
                timestamp,
                runningCount: eventData.runningPickles.length,
            });

            // Aggregate rule stats
            for (const ruleResult of eventData.rules_results) {
                const rule = ruleResult.rule;
                const key = `${rule.id ?? rule.name}`;
                
                const matchers = rule.getMatchers().map(m => ({
                    id: m.id,
                    level: m.level,
                    type: m.type,
                    pattern: m.getPattern(),
                }));

                let stats = ruleStatsMap.get(key);
                if (!stats) {
                    stats = {
                        rule: { id: rule.id, name: rule.name, matchers },
                        totalEvaluations: 0,
                        allowedCount: 0,
                        blockedCount: 0,
                        matchers,
                    };
                    ruleStatsMap.set(key, stats);
                }
                
                stats.totalEvaluations++;
                if (ruleResult.result.allowed) {
                    stats.allowedCount++;
                } else {
                    stats.blockedCount++;
                }
            }
        }

        const concurrencyCounts = concurrencySnapshots.map(s => s.runningCount);
        const maxConcurrency = concurrencyCounts.length > 0 ? Math.max(...concurrencyCounts) : 0;
        const minConcurrency = concurrencyCounts.length > 0 ? Math.min(...concurrencyCounts) : 0;
        const averageConcurrency = concurrencyCounts.length > 0 
            ? concurrencyCounts.reduce((a, b) => a + b, 0) / concurrencyCounts.length 
            : 0;

        // A decision is "allowed" if ALL rules allowed it
        const allowedDecisions = schedulingDecisions.filter(d => d.rules_results.every(r => r.result.allowed)).length;
        const blockedDecisions = schedulingDecisions.length - allowedDecisions;

        const duration = startTime && endTime 
            ? endTime.getTime() - startTime.getTime() 
            : undefined;

        return {
            startTime,
            endTime,
            duration,
            schedulingDecisions,
            totalDecisions: schedulingDecisions.length,
            allowedDecisions,
            blockedDecisions,
            maxConcurrency,
            minConcurrency,
            averageConcurrency,
            concurrencySnapshots,
            ruleStats: Array.from(ruleStatsMap.values()),
        };
    }
}
