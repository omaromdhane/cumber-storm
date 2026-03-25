import { expect } from 'chai';
import { ExclusiveRule } from './exclusive_rule';
import { Pickle } from '@cucumber/messages';
import { IPickleMatcher, MatcherLevel, MatcherType } from '../matchers/types';

describe('ExclusiveRule', () => {
    const createPickle = (name: string): Pickle => ({ name } as Pickle);

    const createMockMatcher = (id: string, matchFn: (p: Pickle) => boolean): IPickleMatcher => ({
        id,
        level: MatcherLevel.CUSTOM,
        type: MatcherType.EXACT,
        match: matchFn,
        getPattern: () => `mock:${id}`,
        toString: () => `MockMatcher(${id})`
    });

    it('should allow running when pickle does not match any matcher', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
        ]);

        const pickle = createPickle('C'); // does not match any group
        const running: Pickle[] = [createPickle('A')];
        const runned: Pickle[] = [];

        expect(rule.canRun(pickle, running, runned)).to.be.true;
    });

    it('should allow running when no other conflicting pickles are running', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('Group1', (p: Pickle) => p.name.startsWith('group1')),
            createMockMatcher('Group2', (p: Pickle) => p.name.startsWith('group2')),
        ]);

        const pickle = createPickle('group1_test');
        const running: Pickle[] = [createPickle('group1_other')];
        const runned: Pickle[] = [];

        expect(rule.canRun(pickle, running, runned)).to.be.true;
    });

    it('should block running when a pickle from another group is running', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('Group1', (p: Pickle) => p.name.startsWith('group1')),
            createMockMatcher('Group2', (p: Pickle) => p.name.startsWith('group2')),
        ]);

        const pickle = createPickle('group1_test');
        const running: Pickle[] = [createPickle('group2_other')];
        const runned: Pickle[] = [];

        expect(rule.canRun(pickle, running, runned)).to.be.false;
    });

    it('should allow running when only same-group pickles are running', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('Alpha', (p: Pickle) => p.name.includes('alpha')),
            createMockMatcher('Beta', (p: Pickle) => p.name.includes('beta')),
        ]);

        const pickle = createPickle('alpha_1');
        const running: Pickle[] = [createPickle('alpha_2')];
        const runned: Pickle[] = [];

        expect(rule.canRun(pickle, running, runned)).to.be.true;
    });

    it('should allow running when no pickles are running', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('MatchA', (p: Pickle) => p.name === 'A'),
            createMockMatcher('MatchB', (p: Pickle) => p.name === 'B'),
        ]);

        const pickle = createPickle('A');
        expect(rule.canRun(pickle, [], [])).to.be.true;
    });

    it('should block only if another group has a running pickle, not a finished one', () => {
        const rule = new ExclusiveRule([
            createMockMatcher('MatchX', (p: Pickle) => p.name === 'X'),
            createMockMatcher('MatchY', (p: Pickle) => p.name === 'Y'),
        ]);

        const pickle = createPickle('X');
        const running: Pickle[] = [];
        const runned: Pickle[] = [createPickle('Y')]; // finished → should not block

        expect(rule.canRun(pickle, running, runned)).to.be.true;
    });

    describe('toString', () => {
        it('should return a descriptive string representation', () => {
            const rule = new ExclusiveRule([
                createMockMatcher('matcher1', (p: Pickle) => p.name === 'A'),
                createMockMatcher('matcher2', (p: Pickle) => p.name === 'B'),
            ]);

            const str = rule.toString();
            expect(str).to.include('ExclusiveRule');
            expect(str).to.include('matcher1');
            expect(str).to.include('matcher2');
        });
    });
});
