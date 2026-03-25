import { expect } from 'chai';
import { MaxConcurrentRule } from './max_concurrent_rule';
import type { Pickle } from '@cucumber/messages';
import { IPickleMatcher, MatcherLevel, MatcherType } from '../matchers/types';

describe('MaxConcurrentRule', () => {
    // Helper to create fake Pickles
    const makePickle = (name: string): Pickle => ({ name } as Pickle);

    const createMockMatcher = (id: string, matchFn: (p: Pickle) => boolean): IPickleMatcher => ({
        id,
        level: MatcherLevel.CUSTOM,
        type: MatcherType.EXACT,
        match: matchFn,
        getPattern: () => `mock:${id}`,
        toString: () => `MockMatcher(${id})`
    });

    it('should allow pickles that do not match the matcher', () => {
        const rule = new MaxConcurrentRule(2, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('B1'); // does not match
        const running = [makePickle('A1'), makePickle('A2')];

        expect(rule.canRun(pickle, running, [])).to.be.true;
    });

    it('should allow running when number of matching running pickles is below maxConcurrent', () => {
        const rule = new MaxConcurrentRule(2, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('A3');
        const running = [makePickle('A1')]; // only 1 running
        expect(rule.canRun(pickle, running, [])).to.be.true;
    });

    it('should allow running when number of matching running pickles is exactly one less than maxConcurrent', () => {
        const rule = new MaxConcurrentRule(2, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('A2');
        const running = [makePickle('A1')]; // 1 running, maxConcurrent is 2
        expect(rule.canRun(pickle, running, [])).to.be.true;
    });

    it('should block running when number of matching running pickles equals maxConcurrent', () => {
        const rule = new MaxConcurrentRule(2, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('A3');
        const running = [makePickle('A1'), makePickle('A2')]; // 2 running, maxConcurrent is 2
        expect(rule.canRun(pickle, running, [])).to.be.false;
    });

    it('should block running when number of matching running pickles exceeds maxConcurrent', () => {
        const rule = new MaxConcurrentRule(2, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('A4');
        const running = [makePickle('A1'), makePickle('A2'), makePickle('A3')]; // 3 running
        expect(rule.canRun(pickle, running, [])).to.be.false;
    });

    it('should handle empty running pickles array correctly', () => {
        const rule = new MaxConcurrentRule(1, createMockMatcher('StartsWithA', (p: Pickle) => p.name.startsWith('A')));
        const pickle = makePickle('A1');
        expect(rule.canRun(pickle, [], [])).to.be.true;
    });

    it('should allow multiple pickles when matcher allows unlimited concurrency (maxConcurrent > running)', () => {
        const rule = new MaxConcurrentRule(3, createMockMatcher('StartsWithB', (p: Pickle) => p.name.startsWith('B')));
        const running = [makePickle('B1'), makePickle('B2')]; // 2 running, maxConcurrent 3
        const pickle = makePickle('B3');
        expect(rule.canRun(pickle, running, [])).to.be.true;
    });

    describe('toString', () => {
        it('should return a descriptive string representation', () => {
            const rule = new MaxConcurrentRule(2, createMockMatcher('testMatcher', (p: Pickle) => p.name.startsWith('A')));

            const str = rule.toString();
            expect(str).to.include('MaxConcurrentRule');
            expect(str).to.include('max: 2');
            expect(str).to.include('testMatcher');
        });
    });
});
