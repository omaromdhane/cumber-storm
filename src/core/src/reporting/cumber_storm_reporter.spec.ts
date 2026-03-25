import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { CumberStormReporter } from './cumber_storm_reporter';
import { globalPubsub } from '../events/global_pub_sub';
import { Events } from '../events/types';
import { Pickle } from '@cucumber/messages';
import { globalEventCollector } from '../events/global_event_collector';
import { CumberEvent } from '../events/cumber_event';
import { RuleEvaluationResult } from '../rules/evaluation_result';
import type { IPickleRule } from '../rules/types';

describe('CumberStormReporter', () => {
    let reporter: CumberStormReporter;

    const createMockPickle = (name: string): Pickle => ({
        id: `pickle-${name}`,
        uri: `features/${name}.feature`,
        name,
        language: 'en',
        steps: [],
        tags: [],
        astNodeIds: [`ast-${name}`]
    });

    const createMockRule = (name: string, id?: string): IPickleRule => ({
        id: id ?? `rule-${name}`,
        name,
        canRun: () => true,
        evaluate: () => RuleEvaluationResult.allowed(),
        dispose: () => {},
        getMatchers: () => [],
        toString: () => name,
    });

    const makeAllowed = () => RuleEvaluationResult.allowed('allowed');
    const makeBlocked = () => RuleEvaluationResult.blocked('blocked');

    beforeEach(() => {
        globalEventCollector.clear();
        reporter = new CumberStormReporter();
    });

    afterEach(() => {
        globalEventCollector.clear();
    });

    describe('event collection', () => {
        it('should collect SET_PARALLEL_DEMAND events', () => {
            const pickle = createMockPickle('test1');
            const rule = createMockRule('TestRule');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            const report = reporter.generateReport();
            expect(report.schedulingDecisions).to.have.lengthOf(1);
            expect(report.schedulingDecisions[0].candidate.name).to.equal('test1');
        });
    });

    describe('statistics calculation', () => {
        it('should calculate max concurrency', () => {
            const pickle1 = createMockPickle('test1');
            const pickle2 = createMockPickle('test2');
            const pickle3 = createMockPickle('test3');
            const rule = createMockRule('TestRule');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle1,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle2,
                runningPickles: [pickle1, pickle2],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle3,
                runningPickles: [pickle1, pickle2, pickle3],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            const report = reporter.generateReport();
            expect(report.maxConcurrency).to.equal(3);
            expect(report.minConcurrency).to.equal(0);
        });

        it('should calculate average concurrency', () => {
            const pickle = createMockPickle('test1');
            const rule = createMockRule('TestRule');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [pickle],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [pickle, pickle],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [pickle, pickle, pickle],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            const report = reporter.generateReport();
            expect(report.averageConcurrency).to.equal(2); // (1 + 2 + 3) / 3
        });

        it('should count allowed and blocked decisions', () => {
            const pickle = createMockPickle('test1');
            const rule1 = createMockRule('AllowRule');
            const rule2 = createMockRule('BlockRule');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule: rule1, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule: rule2, result: makeBlocked() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule: rule1, result: makeAllowed() }]
            }));

            const report = reporter.generateReport();
            expect(report.totalDecisions).to.equal(3);
            expect(report.allowedDecisions).to.equal(2);
            expect(report.blockedDecisions).to.equal(1);
        });

        it('should aggregate rule statistics', () => {
            const pickle = createMockPickle('test1');
            const rule = createMockRule('Rule1', 'rule-1');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeBlocked() }]
            }));

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            const report = reporter.generateReport();
            expect(report.ruleStats).to.have.lengthOf(1);
            expect(report.ruleStats[0].totalEvaluations).to.equal(3);
            expect(report.ruleStats[0].allowedCount).to.equal(2);
            expect(report.ruleStats[0].blockedCount).to.equal(1);
        });
    });

    describe('reset', () => {
        it('should clear all collected data', () => {
            const pickle = createMockPickle('test1');
            const rule = createMockRule('TestRule');

            globalPubsub.emit(Events.SET_PARALLEL_DEMAND, new CumberEvent({
                candidate: pickle,
                runningPickles: [],
                runnedPickles: [],
                rules_results: [{ rule, result: makeAllowed() }]
            }));

            let report = reporter.generateReport();
            expect(report.totalDecisions).to.equal(1);

            globalEventCollector.clear();
            report = reporter.generateReport();
            expect(report.totalDecisions).to.equal(0);
            expect(report.schedulingDecisions).to.have.lengthOf(0);
            expect(report.ruleStats).to.have.lengthOf(0);
        });
    });
});
