import { expect } from 'chai';
import { SequentialSingleMatchRule } from './sequential_single_match_rule';
import type { Pickle } from '@cucumber/messages';
import { IPickleMatcher, MatcherLevel, MatcherType } from '../matchers/types';

describe('SequentialSingleMatchRule', () => {
    const makePickle = (name: string): Pickle => ({ name } as Pickle);

    const createMockMatcher = (id: string, matchFn: (p: Pickle) => boolean): IPickleMatcher => ({
        id,
        level: MatcherLevel.CUSTOM,
        type: MatcherType.EXACT,
        match: matchFn,
        getPattern: () => `mock:${id}`,
        toString: () => `MockMatcher(${id})`
    });

    it('should allow running pickles not in the sequence', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
            createMockMatcher('MatchC', (p: Pickle) => p.name === 'C')
        ]);

        const pickle = makePickle('X'); // not in matchers
        expect(rule.canRun(pickle, [], [])).to.be.true;
    });

    it('should block if previous pickle has not run yet', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
            createMockMatcher('MatchC', (p: Pickle) => p.name === 'C')
        ]);

        const pickle = makePickle('B'); // wants to run second
        const running: Pickle[] = [];
        const runned: Pickle[] = []; // A has not run

        expect(rule.canRun(pickle, running, runned)).to.be.false;
    });

    it('should block if previous pickle is still running', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
            createMockMatcher('MatchC', (p: Pickle) => p.name === 'C')
        ]);

        const pickle = makePickle('B');
        const running: Pickle[] = [makePickle('A')]; // A is still running
        const runned: Pickle[] = [];

        expect(rule.canRun(pickle, running, runned)).to.be.false;
    });

    it('should allow running if previous pickle has finished', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
            createMockMatcher('MatchC', (p: Pickle) => p.name === 'C')
        ]);

        const pickle = makePickle('B');
        const running: Pickle[] = [];
        const runned: Pickle[] = [makePickle('A')]; // A finished

        expect(rule.canRun(pickle, running, runned)).to.be.true;
    });

    it('should enforce strict order across multiple pickles', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
            createMockMatcher('MatchC', (p: Pickle) => p.name === 'C')
        ]);

        const pickleC = makePickle('C');
        const pickleB = makePickle('B');
        const pickleA = makePickle('A');

        // Initially, only A can run
        expect(rule.canRun(pickleA, [], [])).to.be.true;
        expect(rule.canRun(pickleB, [], [])).to.be.false;
        expect(rule.canRun(pickleC, [], [])).to.be.false;

        // After A has run
        expect(rule.canRun(pickleB, [], [pickleA])).to.be.true;
        expect(rule.canRun(pickleC, [], [pickleA])).to.be.false;

        // After B has run
        expect(rule.canRun(pickleC, [], [pickleA, pickleB])).to.be.true;
    });

    it('should allow running unrelated pickles anytime', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B')
        ]);

        const unrelated = makePickle('X');
        expect(rule.canRun(unrelated, [], [])).to.be.true;
        expect(rule.canRun(unrelated, [makePickle('A')], [])).to.be.true;
        expect(rule.canRun(unrelated, [], [makePickle('B')])).to.be.true;
    });

    it('should return false if a pickle that has already run is scheduled again', () => {
        const rule = new SequentialSingleMatchRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B')
        ]);
    
        const pickle = makePickle('A');
        const runned = [makePickle('A')];
    
        expect(rule.canRun(pickle, [], runned)).to.be.false;
    });

    describe('toString', () => {
        it('should return a descriptive string representation with order', () => {
            const rule = new SequentialSingleMatchRule([
                createMockMatcher('first', (p: Pickle) => p.name === 'A'),
                createMockMatcher('second', (p: Pickle) => p.name === 'B'),
                createMockMatcher('third', (p: Pickle) => p.name === 'C')
            ]);

            const str = rule.toString();
            expect(str).to.include('SequentialSingleMatchRule');
            expect(str).to.include('first');
            expect(str).to.include('second');
            expect(str).to.include('third');
            expect(str).to.include('order:');
        });
    });
});
