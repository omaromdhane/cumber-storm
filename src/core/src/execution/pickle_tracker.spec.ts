import { expect } from 'chai';
import { PickleTracker } from './pickle_tracker';
import type { Pickle } from '@cucumber/messages';

describe('PickleTracker', () => {
    let tracker: PickleTracker;

    // Helper to create fake Pickles with unique IDs
    const makePickle = (id: string, name: string = `Test ${id}`): Pickle => ({
        id,
        name,
        uri: `features/test.feature`,
        astNodeIds: [id],
        language: 'en',
        steps: [],
        tags: [],
    } as Pickle);

    beforeEach(() => {
        tracker = new PickleTracker();
    });

    describe('registerRunning', () => {
        it('should track pickles that start running', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');

            tracker.registerRunning([p1, p2]);

            expect(tracker.getRunning()).to.have.lengthOf(2);
            expect(tracker.getRunningCount()).to.equal(2);
            expect(tracker.isRunning(p1)).to.be.true;
            expect(tracker.isRunning(p2)).to.be.true;
        });

        it('should detect pickles that have finished', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');
            const p3 = makePickle('3');

            // First call: p1 and p2 are running
            tracker.registerRunning([p1, p2]);
            expect(tracker.getRunned()).to.have.lengthOf(0);

            // Second call: p2 and p3 are running (p1 finished)
            tracker.registerRunning([p2, p3]);
            expect(tracker.getRunned()).to.have.lengthOf(1);
            expect(tracker.hasRunned(p1)).to.be.true;
            expect(tracker.hasRunned(p2)).to.be.false;
        });

        it('should handle multiple pickles finishing at once', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');
            const p3 = makePickle('3');
            const p4 = makePickle('4');

            tracker.registerRunning([p1, p2, p3]);
            tracker.registerRunning([p4]);

            expect(tracker.getRunnedCount()).to.equal(3);
            expect(tracker.hasRunned(p1)).to.be.true;
            expect(tracker.hasRunned(p2)).to.be.true;
            expect(tracker.hasRunned(p3)).to.be.true;
            expect(tracker.hasRunned(p4)).to.be.false;
        });

        it('should handle empty running list', () => {
            const p1 = makePickle('1');

            tracker.registerRunning([p1]);
            tracker.registerRunning([]);

            expect(tracker.getRunnedCount()).to.equal(1);
            expect(tracker.getRunningCount()).to.equal(0);
            expect(tracker.hasRunned(p1)).to.be.true;
        });

        it('should handle initial empty state', () => {
            tracker.registerRunning([]);

            expect(tracker.getRunned()).to.have.lengthOf(0);
            expect(tracker.getRunning()).to.have.lengthOf(0);
        });
    });

    describe('getRunned', () => {
        it('should return all finished pickles', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');
            const p3 = makePickle('3');

            tracker.registerRunning([p1, p2]);
            tracker.registerRunning([p3]);
            tracker.registerRunning([]);

            const runned = tracker.getRunned();
            expect(runned).to.have.lengthOf(3);
            expect(runned.map(p => p.id)).to.include.members(['1', '2', '3']);
        });

        it('should return empty array when no pickles have finished', () => {
            expect(tracker.getRunned()).to.have.lengthOf(0);
        });
    });

    describe('getRunning', () => {
        it('should return currently running pickles', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');

            tracker.registerRunning([p1, p2]);

            const running = tracker.getRunning();
            expect(running).to.have.lengthOf(2);
            expect(running.map(p => p.id)).to.include.members(['1', '2']);
        });

        it('should update when pickles finish', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');

            tracker.registerRunning([p1, p2]);
            tracker.registerRunning([p2]);

            const running = tracker.getRunning();
            expect(running).to.have.lengthOf(1);
            expect(running[0].id).to.equal('2');
        });
    });

    describe('hasRunned', () => {
        it('should return true for finished pickles', () => {
            const p1 = makePickle('1');

            tracker.registerRunning([p1]);
            tracker.registerRunning([]);

            expect(tracker.hasRunned(p1)).to.be.true;
        });

        it('should return false for pickles that have not finished', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');

            tracker.registerRunning([p1]);

            expect(tracker.hasRunned(p1)).to.be.false;
            expect(tracker.hasRunned(p2)).to.be.false;
        });
    });

    describe('isRunning', () => {
        it('should return true for currently running pickles', () => {
            const p1 = makePickle('1');

            tracker.registerRunning([p1]);

            expect(tracker.isRunning(p1)).to.be.true;
        });

        it('should return false for finished pickles', () => {
            const p1 = makePickle('1');

            tracker.registerRunning([p1]);
            tracker.registerRunning([]);

            expect(tracker.isRunning(p1)).to.be.false;
        });

        it('should return false for pickles that have never run', () => {
            const p1 = makePickle('1');

            expect(tracker.isRunning(p1)).to.be.false;
        });
    });

    describe('reset', () => {
        it('should clear all tracked state', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');

            tracker.registerRunning([p1]);
            tracker.registerRunning([p2]);
            tracker.reset();

            expect(tracker.getRunned()).to.have.lengthOf(0);
            expect(tracker.getRunning()).to.have.lengthOf(0);
            expect(tracker.getRunnedCount()).to.equal(0);
            expect(tracker.getRunningCount()).to.equal(0);
        });

        it('should allow fresh tracking after reset', () => {
            const p1 = makePickle('1');

            tracker.registerRunning([p1]);
            tracker.reset();
            tracker.registerRunning([p1]);

            expect(tracker.getRunningCount()).to.equal(1);
            expect(tracker.getRunnedCount()).to.equal(0);
        });
    });

    describe('pickle identification', () => {
        it('should handle pickles without explicit IDs using URI and astNodeIds', () => {
            const p1: Pickle = {
                id: 'Test 1 id',
                name: 'Test 1',
                uri: 'features/test.feature',
                astNodeIds: ['node1'],
                language: 'en',
                steps: [],
                tags: [],
            } as Pickle;

            tracker.registerRunning([p1]);
            expect(tracker.isRunning(p1)).to.be.true;
        });

        it('should distinguish between different pickles with same name', () => {
            const p1 = makePickle('1', 'Same Name');
            const p2 = makePickle('2', 'Same Name');

            tracker.registerRunning([p1]);
            tracker.registerRunning([p2]);

            expect(tracker.hasRunned(p1)).to.be.true;
            expect(tracker.hasRunned(p2)).to.be.false;
        });
    });

    describe('complex execution scenarios', () => {
        it('should handle wave-based execution pattern', () => {
            const wave1 = [makePickle('1'), makePickle('2'), makePickle('3')];
            const wave2 = [makePickle('4'), makePickle('5')];
            const wave3 = [makePickle('6')];

            // Wave 1 starts
            tracker.registerRunning(wave1);
            expect(tracker.getRunningCount()).to.equal(3);
            expect(tracker.getRunnedCount()).to.equal(0);

            // Wave 1 finishes, Wave 2 starts
            tracker.registerRunning(wave2);
            expect(tracker.getRunningCount()).to.equal(2);
            expect(tracker.getRunnedCount()).to.equal(3);

            // Wave 2 finishes, Wave 3 starts
            tracker.registerRunning(wave3);
            expect(tracker.getRunningCount()).to.equal(1);
            expect(tracker.getRunnedCount()).to.equal(5);

            // All finish
            tracker.registerRunning([]);
            expect(tracker.getRunningCount()).to.equal(0);
            expect(tracker.getRunnedCount()).to.equal(6);
        });

        it('should handle overlapping execution', () => {
            const p1 = makePickle('1');
            const p2 = makePickle('2');
            const p3 = makePickle('3');

            tracker.registerRunning([p1, p2]);
            tracker.registerRunning([p2, p3]); // p1 finishes, p3 starts, p2 continues
            tracker.registerRunning([p3]); // p2 finishes, p3 continues

            expect(tracker.hasRunned(p1)).to.be.true;
            expect(tracker.hasRunned(p2)).to.be.true;
            expect(tracker.hasRunned(p3)).to.be.false;
            expect(tracker.isRunning(p3)).to.be.true;
        });

        it('should handle rapid start-stop cycles', () => {
            const pickles = Array.from({ length: 10 }, (_, i) => makePickle(`${i}`));

            for (let i = 0; i < pickles.length; i++) {
                tracker.registerRunning([pickles[i]]);
                if (i > 0) {
                    expect(tracker.hasRunned(pickles[i - 1])).to.be.true;
                }
            }

            tracker.registerRunning([]);
            expect(tracker.getRunnedCount()).to.equal(10);
        });
    });
});
